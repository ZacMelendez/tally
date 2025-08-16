import React from "react";
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
                <div className="space-y-8">
                    <div className="space-y-4">
                        <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            Tally
                        </h1>
                        <p className="text-xl text-muted-foreground">
                            Take control of your financial future with real-time
                            net worth tracking
                        </p>
                    </div>

                    <div className="space-y-6">
                        {features.map((feature) => {
                            const Icon = feature.icon;
                            return (
                                <div
                                    key={feature.title}
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
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex justify-center lg:justify-end">
                    <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md space-y-6 shadow-sm">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold text-foreground">
                                Welcome Back
                            </h2>
                            <p className="text-muted-foreground">
                                Sign in to continue to your dashboard
                            </p>
                        </div>

                        <button
                            onClick={signInWithGoogle}
                            className="w-full bg-primary text-primary-foreground font-medium py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 hover:bg-primary/90"
                        >
                            <Chrome className="w-5 h-5" />
                            Continue with Google
                        </button>

                        <div className="text-center text-sm text-muted-foreground space-y-2">
                            <p>
                                By signing in, you agree to our terms of service
                                and privacy policy.
                            </p>
                            <p>Your financial data is encrypted and secure.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
