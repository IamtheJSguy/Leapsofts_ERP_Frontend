import { Typography } from '@mui/material';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { useKanbanBoards } from '@/hooks/api/useKanban';
import { CircularProgress, Box } from '@mui/material';

const KanbanPage = () => {
  const { data: boards = [], isLoading } = useKanbanBoards();
  const defaultBoardId = boards[0]?._id;

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Kanban Board
      </Typography>
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <KanbanBoard boardId={defaultBoardId} />
      )}
    </>
  );
};

export default KanbanPage;
