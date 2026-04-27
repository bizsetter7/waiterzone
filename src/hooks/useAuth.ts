import { useAuthContext } from '@/components/auth/AuthProvider';

/**
 * [Refactored] useAuth — Now consumes global AuthContext
 * All components calling useAuth() will now share the same reactive state.
 * This fixes the 'Header not syncing after login' issue.
 */
export function useAuth() {
    const context = useAuthContext();
    
    return {
        isLoggedIn: context.isLoggedIn,
        isLoading: context.isLoading,
        user: context.user,
        login: context.login,
        signIn: context.signIn,
        signUp: context.signUp,
        logout: context.logout,
        userType: context.userType,
        userName: context.userName,
        userNickname: context.userNickname,
        userCredit: context.userCredit,
        userPoints: context.userPoints,
        userJumpBalance: context.userJumpBalance,
        userReferrer: context.userReferrer,
        isSimulated: context.isSimulated,
        isVerifiedPartnerVerified: context.isVerifiedPartnerVerified
    };
}

export type { UserSession } from '@/components/auth/AuthProvider';
