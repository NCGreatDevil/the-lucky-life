// Cloudflare Pages 定时任务
// 每天 0:00 执行，重置用户日常属性

export async function scheduled(event, env, ctx) {
    console.log('定时任务开始执行:', new Date().toISOString());

    const db = env['game-db'];

    try {
        // 获取所有用户
        const users = await db.prepare('SELECT id FROM users').all();

        if (!users.results || users.results.length === 0) {
            console.log('没有用户需要重置');
            return;
        }

        console.log(`找到 ${users.results.length} 个用户，开始重置属性`);

        const now = new Date().toISOString();
        let successCount = 0;
        let failCount = 0;

        for (const user of users.results) {
            try {
                // 随机运气值 (0-100)
                const randomLuck = Math.floor(Math.random() * 101);

                // 更新用户属性
                await db.prepare(
                    'UPDATE user_attributes SET energy = 80, vitality = 60, luck = ?, updated_at = ? WHERE user_id = ?'
                ).bind(randomLuck, now, user.id).run();

                successCount++;
            } catch (error) {
                console.error(`重置用户 ${user.id} 属性失败:`, error);
                failCount++;
            }
        }

        console.log(`定时任务执行完成: 成功 ${successCount} 个，失败 ${failCount} 个`);

    } catch (error) {
        console.error('定时任务执行失败:', error);
        throw error;
    }
}
