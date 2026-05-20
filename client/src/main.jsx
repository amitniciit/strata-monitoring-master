import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App  from './App'
import {
  createBrowserRouter,
  RouterProvider, 
} from "react-router-dom";
import Graph from './components/Graph';
import UploadPanel from './components/UploadPanel';
import PanelList from './components/PanelList';
import PanelView from './components/PanelView';

const router=createBrowserRouter([
  {
    path:'/',
    element:<App/>  
  },
  {
    path:'/:instrumentId/graph',
    element:<Graph/>
  },
  {
   path:'/upload/panel',
   element:<UploadPanel/>
  },
  {
   path:'/all/panel',
   element:<PanelList/>
  },
  {
   path:'/panelview/:panelId',
   element:<PanelView/>
  }

])
createRoot(document.getElementById('root')).render(
  <StrictMode>
      <RouterProvider router={router} />
  </StrictMode>,
)