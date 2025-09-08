// routes.js
import { Outlet, createBrowserRouter } from 'react-router-dom'
import {AppIndex} from './views/AppIndex'

import {Home}  from './views/Home'
import {Search} from './views/Search'
import {Lib} from './views/Lib'
import {Playlist} from './views/Playlist'
import {Category} from './views/Category'
import { Login } from './views/Login'
import { Signup } from './views/Signup'
import { EditPlaylist } from "./views/EditPlaylist";
import { MobileLib } from './views/MobileLib'


const routes = [
 {
  path: '/',
  element: <AppIndex />,
  canActivate: requireAuth(),
  children: [
    {
      path: '',
      element: <Home/>
    },
    {
      path: 'Search',
      element: <Search/>,
    },
    {
      path: 'lib',
      element: <Lib/>
    },
    {
      path: 'Playlist/:id',
      element: <Playlist/>
    },
    {
      path: 'Category/:id',
      element: <Category/>
    },
    {
      path: 'create',
      element: <EditPlaylist/>
    },
    {
      path: 'create/:id',
      element: <EditPlaylist/>
    },
    {
      path: 'library',
      element: <MobileLib/>
    },
  ]
 },
 {
  path: '/login',
  element: <Login />,
  canActivate: requireAuth(),
 },
 {
  path: '/signup',
  element: <Signup />,
  canActivate: requireAuth(),
 },
 {
  path: '*',
  element: Outlet,
 },
];

// navigation guard
function requireAuth(currentLocation, nextLocation) {
  // console.log('c',currentLocation, nextLocation);
 // Check if the user is authenticated
//  if (!isAuthenticated) {
//   Redirect to login page with a query parameter to indicate the intended route
//   navigate('/login?redirect=' + nextLocation.pathname);
//   return false;
//  }
//  return true;
}
export const router =  createBrowserRouter(routes);


