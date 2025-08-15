import React, { createContext, useContext, useEffect, useState } from "react";
import {
    User as FirebaseUser,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "../lib/firebase";
import { User } from "../types";
import toast from "react-hot-toast";

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const signInWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Create user document in Firestore
            const userDoc = doc(db, "users", user.uid);
            const userSnapshot = await getDoc(userDoc);

            if (!userSnapshot.exists()) {
                const userData: Omit<User, "id"> = {
                    email: user.email!,
                    displayName: user.displayName!,
                    photoURL: user.photoURL || undefined,
                    createdAt: new Date(),
                };

                await setDoc(userDoc, userData);
            }

            toast.success("Successfully signed in!");
        } catch (error) {
            console.error("Error signing in:", error);
            toast.error("Failed to sign in. Please try again.");
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            toast.success("Successfully signed out!");
        } catch (error) {
            console.error("Error signing out:", error);
            toast.error("Failed to sign out.");
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(
            auth,
            async (firebaseUser: FirebaseUser | null) => {
                if (firebaseUser) {
                    const userDoc = doc(db, "users", firebaseUser.uid);
                    const userSnapshot = await getDoc(userDoc);

                    if (userSnapshot.exists()) {
                        const userData = userSnapshot.data();
                        setCurrentUser({
                            id: firebaseUser.uid,
                            email: userData.email,
                            displayName: userData.displayName,
                            photoURL: userData.photoURL,
                            createdAt: userData.createdAt.toDate(),
                        });
                    }
                } else {
                    setCurrentUser(null);
                }
                setLoading(false);
            }
        );

        return unsubscribe;
    }, []);

    const value: AuthContextType = {
        currentUser,
        loading,
        signInWithGoogle,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};
