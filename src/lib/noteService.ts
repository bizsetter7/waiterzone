import { supabase } from './supabase';

export interface Note {
    id: string;
    sender: string; // Name
    receiver: string; // Name
    sender_id?: string;
    receiver_id?: string;
    content: string;
    date: string;
    isRead: boolean;
    isAdmin: boolean; // sender is admin
}

const notifyUpdate = () => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notes-updated'));
    }
};

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ko-KR', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
};

export const NoteService = {
    getInbox: async (userName: string, userId?: string): Promise<Note[]> => {
        let query = supabase
            .from('messages')
            .select('*');

        const ADMIN_ALIASES = ['시스템 관리자', '운영자', '관리자', 'admin', '마스터관리자', 'admin_user'];

        if (ADMIN_ALIASES.includes(userName)) {
            query = query.or(`receiver_name.eq.관리자,receiver_name.eq.시스템 관리자,receiver_name.eq.운영자,receiver_name.eq.admin,receiver_name.eq.마스터관리자,receiver_name.eq.admin_user`);
        } else if (userId) {
            query = query.or(`receiver_id.eq.${userId},receiver_name.eq.${userName}`);
        } else {
            query = query.eq('receiver_name', userName);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error('Fetch inbox error:', error);
            // If error is code 'PGRST204' (Column not found) or similar, return empty
            return [];
        }

        return data.map(m => ({
            id: m.id,
            sender: m.sender_name || '시스템',
            receiver: m.receiver_name,
            content: m.content,
            date: formatDate(m.created_at),
            isRead: m.is_read,
            isAdmin: m.sender_name === '[관리자]'
        }));
    },

    getInboxById: async (userId: string): Promise<Note[]> => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('receiver_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Fetch inbox by ID error:', error);
            return [];
        }

        return data.map(m => ({
            id: m.id,
            sender: m.sender_name || '시스템',
            receiver: m.receiver_name,
            content: m.content,
            date: formatDate(m.created_at),
            isRead: m.is_read,
            isAdmin: m.sender_name === '[관리자]'
        }));
    },

    getUnread: async (userName: string, userId?: string): Promise<Note[]> => {
        let query = supabase
            .from('messages')
            .select('*');

        const ADMIN_ALIASES = ['시스템 관리자', '운영자', '관리자', 'admin', '마스터관리자', 'admin_user'];

        if (ADMIN_ALIASES.includes(userName)) {
            query = query.or(`receiver_name.eq.관리자,receiver_name.eq.시스템 관리자,receiver_name.eq.운영자,receiver_name.eq.admin,receiver_name.eq.마스터관리자,receiver_name.eq.admin_user`);
        } else if (userId) {
            query = query.or(`receiver_id.eq.${userId},receiver_name.eq.${userName}`);
        } else {
            query = query.eq('receiver_name', userName);
        }

        const { data, error } = await query
            .eq('is_read', false)
            .order('created_at', { ascending: false });

        if (error) return [];
        return data.map(m => ({
            id: m.id,
            sender: m.sender_name || '시스템',
            receiver: m.receiver_name,
            content: m.content,
            date: formatDate(m.created_at),
            isRead: m.is_read,
            isAdmin: m.sender_name === '[관리자]'
        }));
    },

    getSent: async (userName: string): Promise<Note[]> => {
        let query = supabase
            .from('messages')
            .select('*');

        const ADMIN_ALIASES = ['시스템 관리자', '운영자', '관리자', 'admin', '마스터관리자', 'admin_user'];

        if (ADMIN_ALIASES.includes(userName)) {
            query = query.or(`sender_name.eq.관리자,sender_name.eq.시스템 관리자,sender_name.eq.운영자,sender_name.eq.admin,sender_name.eq.마스터관리자,sender_name.eq.admin_user`);
        } else {
            query = query.eq('sender_name', userName);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) return [];
        return data.map(m => ({
            id: m.id,
            sender: m.sender_name,
            receiver: m.receiver_name,
            content: m.content,
            date: formatDate(m.created_at),
            isRead: m.is_read,
            isAdmin: m.sender_name === '[관리자]'
        }));
    },

    sendNote: async (content: string, senderName: string, receiverName: string = '[관리자]', senderId?: string, receiverId?: string) => {
        const payload: any = {
            sender_name: senderName,
            receiver_name: receiverName,
            content: content,
            is_read: false
        };
        if (senderId) payload.sender_id = senderId;
        if (receiverId) payload.receiver_id = receiverId;

        const { data, error } = await supabase
            .from('messages')
            .insert([payload])
            .select()
            .single();

        if (error) {
            console.error('Send note error:', error);
            throw error;
        }
        notifyUpdate();
        return data;
    },

    deleteNote: async (id: string) => {
        const { error } = await supabase
            .from('messages')
            .delete()
            .eq('id', id);

        if (error) throw error;
        notifyUpdate();
    },

    markAsRead: async (id: string) => {
        const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('id', id);

        if (error) throw error;
        notifyUpdate();
    },

    markMessagesAsRead: async (ids: string[]) => {
        if (!ids || ids.length === 0) return;

        const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', ids);

        if (error) {
            console.error('Error marking messages as read:', error);
            throw error;
        }
        notifyUpdate();
    }
};
