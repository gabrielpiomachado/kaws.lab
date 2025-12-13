import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { CreateReport } from './pages/CreateReport';
import { ReportDetails } from './pages/ReportDetails';
import { Education } from './pages/Education';
import { Profile } from './pages/Profile';
import { AdminDashboard } from './pages/AdminDashboard';

type Page = 'home' | 'create-report' | 'report-details' | 'education' | 'profile' | 'admin';

function App() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedReportId, setSelectedReportId] = useState<string>('');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2E5BBA] to-[#1e3a7a] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mb-4"></div>
          <p className="text-white text-lg font-semibold">Loading UrbInfo...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
  };

  const handleSelectReport = (reportId: string) => {
    setSelectedReportId(reportId);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <Home
            onNavigate={handleNavigate}
            onSelectReport={handleSelectReport}
          />
        );
      case 'create-report':
        return (
          <CreateReport
            onBack={() => handleNavigate('home')}
            onSuccess={(reportId) => {
              setSelectedReportId(reportId);
              handleNavigate('home');
            }}
          />
        );
      case 'report-details':
        return (
          <ReportDetails
            reportId={selectedReportId}
            onBack={() => handleNavigate('home')}
          />
        );
      case 'education':
        return <Education onBack={() => handleNavigate('home')} />;
      case 'profile':
        return (
          <Profile
            onBack={() => handleNavigate('home')}
            onNavigateToAdmin={() => handleNavigate('admin')}
          />
        );
      case 'admin':
        return <AdminDashboard onBack={() => handleNavigate('home')} />;
      default:
        return (
          <Home
            onNavigate={handleNavigate}
            onSelectReport={handleSelectReport}
          />
        );
    }
  };

  return <div className="min-h-screen">{renderPage()}</div>;
}

export default App;
