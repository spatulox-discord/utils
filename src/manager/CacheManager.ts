// src/filesystem/CacheManager.ts
import path from 'path';
import { FileManager } from './FileManager';
import { Log } from '../utils/Log';

export class CacheManager {
    private static get cacheDir(): string {
        const env = process.env.CACHE_FOLDER ? process.env.CACHE_FOLDER : '';
        return path.join(process.cwd(), env, `.utilscache`);
    }

    private static cleanCacheId(key: string): string {
        return key.replace(/[^a-zA-Z0-9_-]/g, '_')
    }

    private static createFilePath(filename: string): string {
        return path.join(this.cacheDir, `${filename}.json`);
    }


    /**
     * New file with cache_id as name
     * @param cache_id - id which become the cache file name
     * @param initialData - optional initial data
     * @returns true if success, false otherwise
     */
    static async createCache(cache_id: string, initialData: any = {}): Promise<boolean> {
        if (!cache_id || typeof cache_id !== 'string' || cache_id.trim() === '') {
            Log.error('"Key" to create a cache must be a non-empty string');
            return false;
        }

        const cleanCacheId = cache_id.replace(/[^a-zA-Z0-9_-]/g, '_'); // Nettoie le nom
        Log.info(`Creating cache file: ${cleanCacheId}.json`);

        return await FileManager.writeJsonFile(
            this.cacheDir,
            this.cleanCacheId(cache_id),
            initialData
        );
    }

    /**
     * Read cache data or create empty one
     * @param cache_id
     * @param default_data default data with default key/value This will be send back if the cache doesn't exist and need to be created
     * @returns true if success, false otherwise
     */
    static async getOrCreateCache<T = any>(cache_id: string, default_data: T): Promise<T | false> {
        if (!cache_id || typeof cache_id !== 'string' || cache_id.trim() === '') {
            Log.error('"cache_id" to get or create a cache must be a non-empty string');
            return false;
        }

        const cleanCacheId = this.cleanCacheId(cache_id);
        const filePath = this.createFilePath(cleanCacheId)

        // Vérifie si le fichier existe déjà
        if (await FileManager.fileExists(filePath)) {
            Log.info(`Cache already exists: ${cleanCacheId}.json`);
            return FileManager.readJsonFile<T>(filePath);
        }

        // Crée le cache s'il n'existe pas
        Log.info(`Creating new cache file: ${this.cacheDir}/${cleanCacheId}.json`);
        const res = await FileManager.writeJsonFile(
            this.cacheDir,
            cleanCacheId,
            default_data
        );
        return res ? default_data : false
    }

    /**
     * Read cache data
     * @param cache_id - cache_id to read
     * @returns Json data, false otherwise
     */
    static async readCache<T = any>(cache_id: string): Promise<T | false> {
        if (!cache_id || typeof cache_id !== 'string') {
            Log.error('"Key" must be a string');
            return false;
        }

        const cleanCacheId = this.cleanCacheId(cache_id)
        const filePath = this.createFilePath(cleanCacheId)

        if (!(await FileManager.fileExists(filePath))) {
            Log.debug(`Cache not found: ${cleanCacheId}.json`);
            return false;
        }

        return await FileManager.readJsonFile<T>(filePath);
    }

    /**
     * Overwrite cache data with the new data
     * @param cache_id - ID of the cache
     * @param data - new data
     * @returns true if success, false otherwise
     */
    static async writeCache(cache_id: string, data: any): Promise<boolean> {
        if (!cache_id || typeof cache_id !== 'string') {
            Log.error('Cache ID must be a string');
            return false;
        }

        const cleanCacheId = this.cleanCacheId(cache_id);

        Log.info(`Writing to cache: ${cleanCacheId}.json`);

        return await FileManager.writeJsonFile(
            this.cacheDir,
            cleanCacheId,
            data
        );
    }

    /**
     * Update specific property of the cache
     * @param cache_id - ID of the cache
     * @param property - property to update, with key and value
     * @returns true if success, false otherwise
     */
    static async updateCacheProperty(cache_id: string, property: {key: string, value: any}): Promise<boolean> {
        const cacheData = await this.readCache(cache_id);
        if (cacheData === false) {
            Log.error(`Cache ${cache_id} not found`);
            return false;
        }

        (cacheData as any)[property.key] = property.value;
        return await this.writeCache(cache_id, cacheData);
    }

    /**
     * Reset an entire cache
     * @param cache_id - cache ID to reset
     * @returns true if success, false otherwise
     */
    static async resetCache(cache_id: string): Promise<boolean> {
        try {
            const cleanCacheId = cache_id.replace(/[^a-zA-Z0-9_-]/g, '_');
            await this.writeCache(cache_id, {});
            Log.info(`Reset cache: ${cleanCacheId}.json`);
            return true;
        } catch (error) {
            Log.error(`Failed to reset cache ${cache_id}: ${error}`);
            return false;
        }
    }

    /**
     * Delete an entire cache
     * @param cache_id - cache ID to delete
     * @returns true if success, false otherwise
     */
    static async deleteCache(cache_id: string): Promise<boolean> {
        try {
            const cleanCacheId = cache_id.replace(/[^a-zA-Z0-9_-]/g, '_');
            const filePath = this.createFilePath(cleanCacheId)
            if(await FileManager.deleteFile(filePath)){
                Log.info(`Deleted cache: ${cleanCacheId}.json`);
                return true;
            }
            return false
        } catch (error) {
            Log.error(`Failed to delete cache ${cache_id}: ${error}`);
            return false;
        }
    }

    /**
     * List every existing cache
     * @returns Array of cache_id, false otherwise
     */
    static async listCaches(): Promise<string[] | false> {
        return await FileManager.listJsonFiles(this.cacheDir);
    }

    /**
     * Clean cache data
     * @returns true if success, false otherwise
     */
    static async clearAllCaches(): Promise<boolean> {
        try {
            const caches = await this.listCaches();
            if (caches === false || caches.length === 0) {
                return true;
            }

            let success = true;
            for (const cache of caches) {
                const result = await this.deleteCache(cache.replace('.json', ''));
                if (!result) success = false;
            }
            return success;
        } catch (error) {
            Log.error(`Failed to clear caches: ${error}`);
            return false;
        }
    }
}