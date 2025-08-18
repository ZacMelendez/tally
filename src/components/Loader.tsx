import React from "react";

const Loader: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50 overflow-hidden">
            <div className="relative z-10">
                <div className="relative w-24 h-24">
                    <div className="absolute inset-0 w-24 h-24 border-2 border-gray-800 border-t-emerald-500 rounded-full animate-spin" />
                    <div
                        className="absolute top-2 left-2 w-20 h-20 border border-gray-700 border-b-green-400 rounded-full animate-spin"
                        style={{
                            animationDirection: "reverse",
                            animationDuration: "2s",
                        }}
                    />
                </div>
            </div>

            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent" />
                <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent" />
            </div>
        </div>
    );
};

export default Loader;
