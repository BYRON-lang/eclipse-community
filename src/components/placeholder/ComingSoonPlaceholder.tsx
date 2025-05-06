
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Clock, Home } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export function ComingSoonPlaceholder({ title, description, icon }: ComingSoonProps) {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
      <div className="mb-4 text-eclipse-primary">
        {icon || <Clock size={60} />}
      </div>
      <h1 className="text-2xl font-medium mb-2">{title}</h1>
      <p className="text-eclipse-muted max-w-md mb-8">{description}</p>
      <Button onClick={() => navigate("/chats")} className="bg-eclipse-primary hover:bg-eclipse-primary/90">
        <Home size={16} className="mr-2" /> Back to Chats
      </Button>
    </div>
  );
}
