import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import StudentLogin from "@/pages/StudentLogin";
import AdminLogin from "@/pages/AdminLogin";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import StudentDashboard from "@/pages/StudentDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminUpload from "@/pages/AdminUpload";
import AdminStudents from "@/pages/AdminStudents";
import AdminStudentDetail from "@/pages/AdminStudentDetail";
import AdminResults from "@/pages/AdminResults";
import AdminUploads from "@/pages/AdminUploads";

import { StudentLayout } from "@/components/layout/StudentLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={StudentLogin} />
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/forgot-password" component={ForgotPassword} />
      <Route path="/admin/reset-password" component={ResetPassword} />
      
      <Route path="/dashboard">
        <StudentLayout>
          <StudentDashboard />
        </StudentLayout>
      </Route>
      
      <Route path="/admin/dashboard">
        <AdminLayout>
          <AdminDashboard />
        </AdminLayout>
      </Route>
      
      <Route path="/admin/upload">
        <AdminLayout>
          <AdminUpload />
        </AdminLayout>
      </Route>

      <Route path="/admin/students">
        <AdminLayout>
          <AdminStudents />
        </AdminLayout>
      </Route>
      
      <Route path="/admin/students/:id">
        <AdminLayout>
          <AdminStudentDetail />
        </AdminLayout>
      </Route>

      <Route path="/admin/results">
        <AdminLayout>
          <AdminResults />
        </AdminLayout>
      </Route>

      <Route path="/admin/uploads">
        <AdminLayout>
          <AdminUploads />
        </AdminLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
