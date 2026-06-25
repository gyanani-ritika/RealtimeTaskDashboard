import {useEffect} from 'react';
import NetInfo from '@react-native-community/netinfo';
import {useTaskStore} from '../store/taskStore';

export function useOfflineSync(): void {
  const setOnline = useTaskStore(state => state.setOnline);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected === true;
      setOnline(online);
    });

    NetInfo.fetch().then(state => {
      setOnline(state.isConnected === true);
    });

    return () => {
      unsubscribe();
    };
  }, [setOnline]);
}
