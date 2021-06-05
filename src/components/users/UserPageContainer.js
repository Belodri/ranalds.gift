import React, { useContext } from 'react';
import { Route, Switch, useParams, useRouteMatch } from 'react-router';
import { UserViewContext } from '../../stores/UserViewStore';
import { auth, db } from '../../utils/Firebase';
import UserEditPage from './UserEditPage';
import UserPage from './UserPage';
import './UserPage.css';

function UserPageContainer() {
  const [state, updateState] = useContext(UserViewContext);

  const { path } = useRouteMatch();
  let params = useParams();

  console.log('rendering user page for uid ' + params.userId);

  if (state.userId !== params.userId) {

    console.log('updating user page container state');
    var userId = params.userId;

    db.collection('users').doc(userId).get().then((doc) => {
      //console.log("Document data:", doc.data());

      updateState({
        type: "UPDATE_USER_INFO", 
        payload: { 
          userId: userId,
          username: doc.data().username,
          steam: doc.data().steam,
          twitch: doc.data().twitch,
          dateCreated: doc.data().dateCreated,
          dateModified: doc.data().dateModified
        }
      });
      
      db.collection('builds').where("userId", "==", userId).where('isDeleted', '==', false).orderBy('dateModified', 'desc').limit(10).get().then((querySnapshot) => {
        var userBuilds = [];
        querySnapshot.forEach((build) => {
          userBuilds.push({ id: build.id, data: build.data()});
        });

        updateState({
          type: "UPDATE_USER_BUILDS", 
          payload: {
            builds: userBuilds,
            lastDoc: querySnapshot.docs[querySnapshot.docs.length-1],
            currentPage: 1,
            totalPages: Math.round(querySnapshot.size / 10) + 1
          }
        }); 
      });

      if (auth.currentUser && auth.currentUser.uid === userId) {
        console.log('Authed user is user page user');
        // Load additional build list for liked builds

        db.collection('builds').where("likes", "array-contains", userId).where('isDeleted', '==', false).orderBy('dateModified', 'desc').limit(10).get().then((querySnapshot) => {
          var likedBuilds = [];
          querySnapshot.forEach((build) => {
            likedBuilds.push({ id: build.id, data: build.data()});
          });

          updateState({
            type: "UPDATE_LIKED_BUILDS", 
            payload: {
              builds: likedBuilds,
              lastDoc: querySnapshot.docs[querySnapshot.docs.length-1],
              currentPage: 1,
              totalPages: Math.round(querySnapshot.size / 10) + 1
            }
          }); 
        });
      }
    });

/*     auth.onAuthStateChanged((user) => {
      if (user !== null) {        
        console.log('Authed user detected, getting liked builds');

        if (user.uid === state.userId) {
          console.log('Authed user is user page user');

          db.collection('builds').where("likes", "array-contains", userId).get().then((querySnapshot) => {
            var likedBuilds = [];
            querySnapshot.forEach((build) => {
              likedBuilds.push({ id: build.id, data: build.data()});
            });
  
            updateState({
              type: "UPDATE_LIKED_BUILDS", 
              payload: likedBuilds
            }); 
          });
        }        
      }
    }); */
  }

    var root = document.getElementById('root');
    root.dataset.pageName = 'userPage';

    //console.log('params uid: ' + state.userId);

    return (
      <Switch>
        <Route path={`${path}/view`}>
          <UserPage userId={state.userId}></UserPage>
        </Route>
        <Route path={`${path}/edit`}>
          <UserEditPage></UserEditPage>
        </Route>
      </Switch>
    );
  }

export default UserPageContainer;