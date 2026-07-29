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

/**
 * Projet tel que le manipule l'interface.
 *
 * `tasks` reste un tableau plat, alors que le serveur renvoie désormais une
 * page. C'est délibéré : le tableau Kanban répartit les tâches en colonnes et
 * les déplace d'une à l'autre, il travaille sur l'ensemble de ce qui est
 * chargé. Le hook `useProject` aplatit la page et garde de côté ce qui reste à
 * charger — voir `TasksMeta`.
 */
export type Project = {
  id: string;
  name: string;
  description: string | null;
  owner: { id: string; name: string; email: string };
  members: Member[];
  tasks: Task[];
};

/** Ce que la pagination laisse en dehors du tableau ci-dessus. */
export type TasksMeta = {
  totalCount: number;
  hasMore: boolean;
};

/** Forme réellement renvoyée par GraphQL, avant aplatissement. */
export type ProjectResponse = Omit<Project, 'tasks'> & {
  tasks: { items: Task[]; totalCount: number; hasMore: boolean };
};
