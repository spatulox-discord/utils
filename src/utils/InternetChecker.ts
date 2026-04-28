import { Log } from './Log';
import { Time } from './UnitTime';

export class InternetChecker {
    private static readonly TARGET = 'https://one.one.one.one/'; // Cloudflare DNS HTTPS
    private static readonly RETRY_TIME = Time.second.SEC_30;

    /**
     * Check internet connection towards 1.1.1.1 (Cloudflare DNS)
     * @param tries Number of attempts (0 = infini)
     */
    static async checkConnection(tries: number = 0): Promise<boolean> {
        let attempt = 0;

        Log.info(
            tries > 0
                ? `HTTP ping ${this.TARGET} (max ${tries} attempts)...`
                : `HTTP ping ${this.TARGET} (infinite attempts)...`
        );

        while (tries === 0 || attempt < tries) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

                const response = await fetch(this.TARGET, {
                    method: 'HEAD',
                    signal: controller.signal,
                    cache: 'no-store'
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    const latency = response.headers.get('x-response-time') || '<1ms';
                    Log.info(`Internet connection OK (${latency})`);
                    return true;
                }

            } catch (error: any) {
                attempt++;
                const errorMsg = error.name === 'AbortError'
                    ? 'Timeout (5s)'
                    : error.message || 'Unknown';

                Log.warn(
                    tries > 0
                        ? `Ping failed (${errorMsg}) - Attempt ${attempt}/${tries}`
                        : `Ping failed (${errorMsg}) - Retrying in ${this.RETRY_TIME.toSeconds()} seconds...`
                );

                try {
                    await new Promise(resolve => setTimeout(resolve, this.RETRY_TIME.toMilliseconds()));
                } catch {
                    Log.error('Retry delay failed.');
                }
            }
        }

        Log.error(`No response from ${this.TARGET} after all attempts.`);
        return false;
    }
}