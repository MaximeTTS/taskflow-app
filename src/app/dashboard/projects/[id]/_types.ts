export type TaskImage = { id: string; url: string; publicId: string };

export type Assignee = { id: string; name: string; avatar?: string };

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  assignee: Assignee | null;
  creator: { id: string; name: string };
  images: TaskImage[];
};

export type Member = {
  id: string;
  role: string;
  user: { id: string; name: string; email: string; avatar?: string };
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
  owner: { id: string; name: string; email: string };
  members: Member[];
  tasks: Task[];
};
