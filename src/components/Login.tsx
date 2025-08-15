import React from "react";
import { motion } from "framer-motion";
import { Chrome, TrendingUp, Shield, Zap } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const Login: React.FC = () => {
    const { signInWithGoogle } = useAuth();

    const features = [
        {
            icon: TrendingUp,
            title: "Track Net Worth",
            description:
                "Monitor your financial health with real-time calculations",
        },
        {
            icon: Shield,
            title: "Secure & Private",
            description:
                "Your data is encrypted and protected with Google authentication",
        },
        {
            icon: Zap,
            title: "Quick & Easy",
            description:
                "Add assets and debts in seconds with our intuitive interface",
        },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center">
                {/* Left side - Branding and features */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="space-y-8"
                >
                    <div className="space-y-4">
                        <motion.h1
                            className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                        >
                            Tally
                        </motion.h1>
                        <motion.p
                            className="text-xl text-muted-foreground"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.6 }}
                        >
                            Take control of your financial future with real-time
                            net worth tracking
                        </motion.p>
                    </div>

                    <motion.div
                        className="space-y-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                    >
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <motion.div
                                    key={feature.title}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                        delay: 0.8 + index * 0.1,
                                        duration: 0.5,
                                    }}
                                    className="flex items-start space-x-4"
                                >
                                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                        <Icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-foreground mb-1">
                                            {feature.title}
                                        </h4>
                                        <p className="text-muted-foreground text-sm">
                                            {feature.description}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </motion.div>

                {/* Right side - Login card */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex justify-center lg:justify-end"
                >
                    <motion.div
                        className="bg-card border border-border rounded-lg p-6 w-full max-w-md space-y-6 shadow-sm"
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                        }}
                    >
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold text-foreground">
                                Welcome Back
                            </h2>
                            <p className="text-muted-foreground">
                                Sign in to continue to your dashboard
                            </p>
                        </div>

                        <motion.button
                            onClick={signInWithGoogle}
                            className="w-full bg-primary text-primary-foreground font-medium py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 hover:bg-primary/90"
                            whileTap={{ scale: 0.98 }}
                        >
                            <Chrome className="w-5 h-5" />
                            Continue with Google
                        </motion.button>

                        <div className="text-center text-sm text-muted-foreground space-y-2">
                            <p>
                                By signing in, you agree to our terms of service
                                and privacy policy.
                            </p>
                            <p>Your financial data is encrypted and secure.</p>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
