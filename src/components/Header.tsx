import React from "react";
import { LogOut, User, TrendingUp } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";

const Header: React.FC = () => {
    const { currentUser, logout } = useAuth();

    return (
        <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.05)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            Tally
                        </h1>
                    </div>

                    {/* User menu */}
                    <div className="flex items-center space-x-4">
                        {currentUser && (
                            <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-2">
                                    {currentUser.photoURL ? (
                                        <img
                                            src={currentUser.photoURL}
                                            alt={currentUser.displayName}
                                            className="w-8 h-8 rounded-full ring-2 ring-primary/20"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                                            <User className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                    )}
                                    <span className="text-sm font-medium text-foreground hidden sm:block">
                                        {currentUser.displayName}
                                    </span>
                                </div>

                                <Button
                                    onClick={logout}
                                    variant="ghost"
                                    size="sm"
                                    className="p-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
