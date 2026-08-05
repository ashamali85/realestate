import { requireSuperAdmin } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { prisma } from '@/lib/db';
import { t } from '@/lib/i18n';
import { loadLabelOverrides } from '@/lib/label-overrides';
import { TopBar } from '@/components/TopBar';
import { UsersManager, type UserRow } from '@/components/UsersManager';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const me = await requireSuperAdmin();
  await loadLabelOverrides();
  const locale = await getLocale();

  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
  const rows: UserRow[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    username: u.username,
    role: u.role,
    isActive: u.isActive,
    isSelf: u.id === me.id
  }));

  return (
    <>
      <TopBar user={me} locale={locale} active="users" />
      <main className="container mt-6" style={{ paddingBottom: 60 }}>
        <h1 style={{ marginBottom: 16 }}>{t('users_title', locale)}</h1>
        <UsersManager rows={rows} locale={locale} />
      </main>
    </>
  );
}
