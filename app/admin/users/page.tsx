import { connectToDatabase } from '@/lib/mongodb';
import UserModel from '@/lib/models/User';
import { AppUser } from '@/types';
import AddUserForm from '@/components/AddUserForm';
import AdminUserRow from '@/components/AdminUserRow';

export const dynamic = 'force-dynamic';

async function getUsers(): Promise<AppUser[]> {
  await connectToDatabase();
  const users = await UserModel.find().sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(users));
}

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <div>
      <h1 className="mb-5 text-xl font-extrabold text-navy">Users ({users.length})</h1>
      <AddUserForm />
      <div className="overflow-x-auto rounded-xl2 border border-border bg-white p-4">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-xs uppercase text-muted">
              <th className="pb-2 pr-3">Name</th>
              <th className="pb-2 pr-3">Phone</th>
              <th className="pb-2">Wallet</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <AdminUserRow key={user._id} user={user} />
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="py-6 text-center text-muted">No users yet.</p>}
      </div>
    </div>
  );
}
