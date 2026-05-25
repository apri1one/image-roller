import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import logger from '../utils/logger.js';
import { broadcastEvent } from '../services/ui-manager.js';
import { getProviderPoolManager } from '../services/service-manager.js';
import { CONFIG } from '../core/config-manager.js';
import { createProviderConfig } from '../utils/provider-utils.js';
import { withFileLock, atomicWriteFile } from '../utils/file-lock.js';

/**
 * 批量导入 Grok SSO Tokens (流式处理)
 * @param {Array} tokens - Token 数组 (可以是字符串数组 or 对象数组)
 * @param {Function} onProgress - 进度回调函数
 * @param {Boolean} skipDuplicateCheck - 是否跳过重复检查
 * @returns {Promise<Object>} 导入结果统计
 */
export async function batchImportGrokTokensStream(tokens, onProgress = null, skipDuplicateCheck = false) {
    const results = {
        total: tokens.length,
        success: 0,
        failed: 0,
        details: []
    };

    const providerType = 'grok-web';
    const poolManager = getProviderPoolManager();
    const allPools = poolManager ? poolManager.providerPools : (CONFIG.providerPools || {});
    if (!allPools[providerType]) allPools[providerType] = [];
    
    const pool = allPools[providerType];

    for (let i = 0; i < tokens.length; i++) {
        let ssoToken = tokens[i];
        
        // 支持多种输入格式：直接是字符串或者是包含 sso 字段的对象
        if (typeof ssoToken === 'object' && ssoToken !== null) {
            ssoToken = ssoToken.sso || ssoToken.GROK_COOKIE_TOKEN || ssoToken.token;
        }

        const progressData = {
            index: i + 1,
            total: tokens.length,
            current: null
        };

        try {
            if (!ssoToken || typeof ssoToken !== 'string') {
                throw new Error('无效的 SSO Token 格式');
            }

            // 清理 token 字符串（去除前后空格及可能的引号）
            let cleanedToken = ssoToken.trim();
            if (cleanedToken.startsWith('"') && cleanedToken.endsWith('"')) {
                cleanedToken = cleanedToken.substring(1, cleanedToken.length - 1).trim();
            }
            if (cleanedToken.startsWith("'") && cleanedToken.endsWith("'")) {
                cleanedToken = cleanedToken.substring(1, cleanedToken.length - 1).trim();
            }

            if (!cleanedToken) {
                throw new Error('SSO Token 不能为空');
            }

            // 使用 token 的哈希作为 ID 防止重复
            const tokenId = crypto.createHash('md5').update(cleanedToken).digest('hex').substring(0, 12);

            // 检查重复
            if (!skipDuplicateCheck) {
                const existingProvider = pool.find(p => {
                    // 1. 精确匹配 Token 字段
                    if (p.GROK_COOKIE_TOKEN === cleanedToken) return true;
                    
                    // 2. 模糊匹配：检查对象的所有字符串属性值是否包含该 Token (处理可能的不同字段名)
                    return Object.values(p).some(val => 
                        typeof val === 'string' && val.trim() === cleanedToken
                    );
                });
                
                if (existingProvider) {
                     progressData.current = {
                        index: i + 1,
                        success: false,
                        error: 'duplicate',
                        existingPath: existingProvider.customName || existingProvider.uuid
                    };
                    results.failed++;
                    results.details.push(progressData.current);
                    if (onProgress) {
                        onProgress({
                            ...progressData,
                            successCount: results.success,
                            failedCount: results.failed
                        });
                    }
                    continue;
                }
            }

            // 创建新的提供商配置
            const newProvider = createProviderConfig({
                credPathKey: 'GROK_COOKIE_TOKEN',
                credPath: cleanedToken, // 直接存储 Token 字符串
                defaultCheckModel: 'grok-4.1-mini',
                needsProjectId: false,
                urlKeys: ['GROK_BASE_URL', 'GROK_CF_CLEARANCE', 'GROK_USER_AGENT']
            });

            // 补充 Grok 默认配置
            newProvider.GROK_BASE_URL = 'https://grok.com';
            newProvider.customName = `Imported Token ${tokenId}`;

            // 添加到 Pool
            pool.push(newProvider);

            progressData.current = {
                index: i + 1,
                success: true,
                path: `Token ${tokenId}`
            };
            results.success++;

        } catch (error) {
            logger.error(`[Grok Batch Import] Token ${i + 1} import failed:`, error.message);
            progressData.current = {
                index: i + 1,
                success: false,
                error: error.message
            };
            results.failed++;
        }

        results.details.push(progressData.current);
        
        // 发送进度更新
        if (onProgress) {
            onProgress({
                ...progressData,
                successCount: results.success,
                failedCount: results.failed
            });
        }
    }

    // 如果有成功的，更新 ProviderPoolManager 并广播事件
    if (results.success > 0) {
        try {
            // 确保 CONFIG.providerPools 与 allPools 同步
            CONFIG.providerPools = allPools;
            
            // 更新 ProviderPoolManager
            if (poolManager) {
                poolManager.providerPools = allPools;
                poolManager.initializeProviderStatus();
            }

            // 广播更新事件
            broadcastEvent('config_update', {
                action: 'batch_add',
                provider: 'grok',
                count: results.success,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error(`[Grok Batch Import] Failed to update provider pools: ${error.message}`);
        }
    }

    return results;
}
