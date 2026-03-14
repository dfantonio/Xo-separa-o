import type { Task } from '../types/task';

export type RootStackParamList = {
  Onboarding: undefined;
  CreateSession: undefined;
  JoinSession: undefined;
  Home: undefined;
  CreateTask: { task?: Task } | undefined;
};
