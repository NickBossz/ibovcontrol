import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useUserRole";
import { AppLayout } from "@/components/AppLayout";
import { Dashboard } from "@/components/Dashboard";
import { CarteiraPage } from "@/components/CarteiraPage";
import { AdminPage } from "@/components/AdminPage";
import { UserProfile } from "@/components/UserProfile";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const Index = () => {
  const { user, loading } = useAuth();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const [currentPage, setCurrentPage] = useState("dashboard");

  // Redirecionar usuários não-admin que tentem acessar a página admin
  useEffect(() => {
    if (!isAdminLoading && currentPage === "admin" && isAdmin !== true) {
      setCurrentPage("dashboard");
    }
  }, [isAdmin, isAdminLoading, currentPage]);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "carteira":
        return <CarteiraPage />;
      case "admin":
        return <AdminPage />;
      case "profile":
        return <UserProfile />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ProtectedRoute>
      <AppLayout 
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onLogout={() => {}} // O logout agora é gerenciado pelo AuthContext
      >
        {renderCurrentPage()}
      </AppLayout>
    </ProtectedRoute>
  );
};

export default Index;
