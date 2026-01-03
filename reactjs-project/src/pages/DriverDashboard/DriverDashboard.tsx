import type { User } from "../../types/User";

interface DriverDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function DriverDashboard({ user, onLogout }: DriverDashboardProps) {
  
  return (
    <div>
      <h2>{'Driver Dashboard'}</h2>
      <p>{'Hello'} {user.name} ({user.email})</p>
      <button onClick={onLogout}>{'Navigation'}</button>
    </div>
  );
}