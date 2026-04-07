import { RegisterCleanerPage } from './components/pages/RegisterCleanerPage';

export default function RegisterCleanerDemo() {
  const handleRegisterSuccess = () => {
    console.log('Registration successful!');
    alert('Account created successfully! This is just a demo.');
  };

  return (
    <RegisterCleanerPage 
      inviteToken="demo123token"
      companyName="SparkTask Company"
      onRegisterSuccess={handleRegisterSuccess}
    />
  );
}
