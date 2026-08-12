import { supabase } from '../lib/supabase';

export class SubscriptionService {
  static async getSubscriptionStatus(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_type, subscription_expiry')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      return { subscription_type: 'free', subscription_expiry: null };
    }
  }

  static isPremium(subscriptionType: string | undefined): boolean {
    return (
      subscriptionType === 'monthly' ||
      subscriptionType === 'yearly' ||
      subscriptionType === 'pro'
    );
  }
}
