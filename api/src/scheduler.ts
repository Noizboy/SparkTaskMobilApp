import cron from 'node-cron';
import { pool } from './db';
import { createNotificationForUser } from './routes/notifications';

type LangCode = 'en' | 'es' | 'pt' | 'zh';

// ─── Reminder strings per language ───────────────────────────────────────────
const REMINDER_STRINGS: Record<LangCode, {
  title: string;
  body: (orderNumber: string, time: string) => string;
}> = {
  en: {
    title: 'Job starting soon',
    body: (n, t) => `Job #${n} starts in 1 hour at ${t}. Get ready!`,
  },
  es: {
    title: 'Servicio próximo',
    body: (n, t) => `El servicio #${n} comienza en 1 hora a las ${t}. ¡Prepárate!`,
  },
  pt: {
    title: 'Serviço em breve',
    body: (n, t) => `O serviço #${n} começa em 1 hora às ${t}. Prepare-se!`,
  },
  zh: {
    title: '服务即将开始',
    body: (n, t) => `服务 #${n} 将在 1 小时后（${t}）开始。请做好准备！`,
  },
};

// ─── Job started strings per language ────────────────────────────────────────
const STARTED_STRINGS: Record<LangCode, {
  title: string;
  body: (orderNumber: string) => string;
}> = {
  en: {
    title: 'Job in progress',
    body: (n) => `Job #${n} has been started.`,
  },
  es: {
    title: 'Servicio en curso',
    body: (n) => `El servicio #${n} ha comenzado.`,
  },
  pt: {
    title: 'Serviço em andamento',
    body: (n) => `O serviço #${n} foi iniciado.`,
  },
  zh: {
    title: '服务进行中',
    body: (n) => `服务 #${n} 已开始。`,
  },
};

// ─── Parse "9:00 AM" or "14:30" → minutes since midnight ────────────────────
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const upper = timeStr.trim().toUpperCase();
  const ampm = upper.includes('AM') || upper.includes('PM');
  if (ampm) {
    const [timePart, period] = upper.split(/\s+/);
    const [hStr, mStr = '0'] = timePart.split(':');
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }
  const [hStr, mStr = '0'] = upper.split(':');
  return parseInt(hStr, 10) * 60 + parseInt(mStr, 10);
}

// ─── 1-hour reminder scheduler (runs every minute) ───────────────────────────
// Sends one reminder per cleaner per order. Tracks sent reminders in a Set
// keyed by "orderId:userId" to avoid duplicates across restarts (server restart
// resets the Set — acceptable; reminders re-fire only if the server was down
// exactly during the 60-min window, which is an edge case).
const sentReminders = new Set<string>();

export function startScheduler(): void {
  // ── 1-hour reminders — runs every minute ──────────────────────────────────
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      // Look for scheduled orders today whose time is in [now+55, now+65] minutes
      // (±5 min window so we never miss a job due to a cron tick being slightly off)
      const result = await pool.query(
        `SELECT o.id, o.order_number, o.time, o.date,
                ae.employee_name, u.id AS user_id, u.language
         FROM orders o
         JOIN assigned_employees ae ON ae.order_id = o.id
         JOIN users u ON u.name = ae.employee_name
         WHERE o.date = $1
           AND o.status = 'scheduled'`,
        [todayStr]
      );

      for (const row of result.rows) {
        const jobMinutes = parseTimeToMinutes(row.time as string);
        const diff = jobMinutes - nowMinutes;

        if (diff >= 55 && diff <= 65) {
          const key = `${row.id as string}:${row.user_id as string}`;
          if (sentReminders.has(key)) continue;
          sentReminders.add(key);

          const lang: LangCode = (row.language as LangCode) ?? 'en';
          const strings = REMINDER_STRINGS[lang] ?? REMINDER_STRINGS.en;
          const orderNumber = String(row.order_number);
          const time = String(row.time);

          await createNotificationForUser(
            row.user_id as string,
            'reminder',
            strings.title,
            strings.body(orderNumber, time),
            { orderNumber, time }
          );

          console.log(`[Scheduler] Sent 1-hour reminder to user ${row.user_id as string} for order #${orderNumber}`);
        }
      }
    } catch (err) {
      console.error('[Scheduler] 1-hour reminder error:', err);
    }
  });

  console.log('✓ Scheduler started (1-hour reminders active)');
}

// ─── Send "job started" notification ─────────────────────────────────────────
// Called from orders route when status changes to 'in-progress'.
export async function sendJobStartedNotification(
  userId: string,
  orderNumber: string,
  lang?: string
): Promise<void> {
  const l: LangCode = (lang as LangCode) ?? 'en';
  const strings = STARTED_STRINGS[l] ?? STARTED_STRINGS.en;

  await createNotificationForUser(
    userId,
    'started',
    strings.title,
    strings.body(orderNumber),
    { orderNumber }
  );
}
