import { createBrowserRouter } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { Feed } from './pages/Feed';
import { Profile } from './pages/Profile';
import { useOutletContext } from 'react-router';

// Helper to use outlet context
export const useFeedContext = () => {
  return useOutletContext<{ onCompose: () => void }>();
};

// Wrapper components to pass context
const FeedWrapper = () => {
  const { onCompose } = useFeedContext();
  return <Feed onCompose={onCompose} />;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <FeedWrapper />,
      },
      {
        path: 'profile/:username',
        element: <Profile />,
      },
    ],
  },
]);
