import React from "react";
import { motion } from "framer-motion";
import { LogOut, User, TrendingUp } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";

const Header: React.FC = () => {
    const { currentUser, logout } = useAuth();

    return (
        <motion.header
            className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.05)]"
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <motion.div
                        className="flex items-center space-x-3"
                        transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 17,
                        }}
                    >
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            Tally
                        </h1>
                    </motion.div>

                    {/* User menu */}
                    <div className="flex items-center space-x-4">
                        {currentUser && (
                            <motion.div
                                className="flex items-center space-x-3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                            >
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

                                <motion.div whileTap={{ scale: 0.9 }}>
                                    <Button
                                        onClick={logout}
                                        variant="ghost"
                                        size="sm"
                                        className="p-2"
                                    >
                                        <LogOut className="w-4 h-4" />
                                    </Button>
                                </motion.div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </motion.header>
    );
};

export default Header;
