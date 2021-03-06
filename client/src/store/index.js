import Vue from 'vue'
import Vuex from 'vuex'
import router from '../router/index'

import {
  GET_CURRENT_USER,
  GET_POSTS,
  ADD_POST,
  SIGNIN_USER,
  SIGNUP_USER,
  SEARCH_POSTS,
  GET_USER_POSTS,
  UPDATE_USER_POST,
  DELETE_USER_POST
} from '../queries'
import { defaultClient as apolloClient } from '../main'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    posts: [],
    userPosts: [],
    searchResults: [],
    user: null,
    loading: false,
    error: null,
    authError: null
  },
  mutations: {
    setPosts: (state, payload) => {
      state.posts = payload
    },
    setSearchResults: (state, payload) => {
      if (payload !== null) {
        state.searchResults = payload
      }
    },
    setUser: (state, payload) => {
      state.user = payload
    },
    setUserPosts: (state, payload) => {
      state.userPosts = payload
    },
    setLoading: (state, payload) => {
      state.loading = payload
    },
    setError: (state, payload) => {
      state.error = payload
    },
    setAuthError: (state, payload) => {
      state.authError = payload
    },
    clearUser: state => {
      state.user = null
    },
    clearSearchResults: state => { state.searchResults = [] },
    clearError: state => {
      state.error = null
    }
  },
  actions: {
    getCurrentUser: ({ commit }) => {
      commit('setLoading', true)
      apolloClient.query({
        query: GET_CURRENT_USER
      }).then(({ data }) => {
        commit('setLoading', false)
        // Add user data to state
        commit('setUser', data.getCurrentUser)
        console.log(data.getCurrentUser)
      }).catch(err => {
        commit('setLoading', false)
        console.log(err)
      })
    },
    getPosts: ({ commit }) => {
      commit('setLoading', true)
      apolloClient
        .query({
          query: GET_POSTS
        }).then(({ data }) => {
          commit('setPosts', data.getPosts)
          commit('setLoading', false)
        })
        .catch(err => {
          commit('setLoading', false)
          console.error(err)
        })
    },
    getUserPosts: ({ commit }, payload) => {
      apolloClient.query({
        query: GET_USER_POSTS,
        variables: payload
      }).then(({ data }) => {
        commit('setUserPosts', data.getUserPosts)
        // console.log(data.getUserPosts)
      })
        .catch(err => {
          console.error(err)
        })
    },
    searchPosts: ({ commit }, payload) => {
      apolloClient.query({
        query: SEARCH_POSTS,
        variables: payload
      }).then(({ data }) => {
        // console.log(data.searchPosts)
        commit('setSearchResults', data.searchPosts)
      }).catch(err => console.error(err))
    },
    addPost: ({ commit }, payload) => {
      apolloClient
        .mutate({
          mutation: ADD_POST,
          variables: payload,
          update: (cache, { data: { addPost } }) => {
            // First read the query you want to update
            const data = cache.readQuery({ query: GET_POSTS })
            console.log(data)
            // Create updated data
            data.getPosts.unshift(addPost)
            // write updated data back to query
            cache.writeQuery({
              query: GET_POSTS,
              data
            })
          },
          // optimistic response ensures data is addded immdiately the update function
          optimisticResponse: {
            __typename: 'Mutation',
            addPost: {
              __typename: 'Post',
              // make sure that it's added to beginning of array
              _id: -1,
              ...payload
            }
          }
        })
        .then(({ data }) => {
          console.log(data.addPost)
        })
        .catch(err => {
          console.error(err)
        })
    },
    updateUserPost: ({ state, commit }, payload) => {
      apolloClient.mutate({
        mutation: UPDATE_USER_POST,
        variables: payload
      })
        .then(({ data }) => {
          // console.log('user posts', data.userPosts)
          // console.log('update post', data.updateUserPost)
          const index = state.userPosts.findIndex(
            post => post._id === data.updateUserPost._id
          )
          const userPosts = [
            ...state.userPosts.slice(0, index),
            data.updateUserPost,
            ...state.userPosts.slice(index + 1)
          ]
          commit('setUserPosts', userPosts)
        })
        .catch(err => {
          console.error(err)
        })
    },
    deleteUserPost: ({ state, commit }, payload) => {
      apolloClient.mutate({
        mutation: DELETE_USER_POST,
        variables: payload
      })
        .then(({ data }) => {
          const index = state.userPosts.findIndex(
            post => post._id === data.deleteUserPost._id
          )
          const userPosts = [
            ...state.userPosts.slice(0, index),
            ...state.userPosts.slice(index + 1)
          ]
          commit('setUserPosts', userPosts)
        })
        .catch(err => {
          console.log(err)
        })
    },
    signinUser: ({ commit }, payload) => {
      commit('clearError')
      commit('setLoading', true)
      apolloClient
        .mutate({
          mutation: SIGNIN_USER,
          variables: payload
        })
        .then(({ data }) => {
          commit('setLoading', false)
          localStorage.setItem('token', data.signinUser.token)
          // to make sure created method is run in main.js (we run currrentUser), reload the page
          router.go()
        })
        .catch(err => {
          commit('setLoading', false)
          commit('setError', err)
          console.log(err)
        })
    },
    signupUser: ({ commit }, payload) => {
      commit('clearError')
      commit('setLoading', true)
      apolloClient
        .mutate({
          mutation: SIGNUP_USER,
          variables: payload
        })
        .then(({ data }) => {
          commit('setLoading', false)
          localStorage.setItem('token', data.signupUser.token)
          // to make sure created method is run in main.js (we run currrentUser), reload the page
          router.go()
        })
        .catch(err => {
          commit('setLoading', false)
          commit('setError', err)
          console.log(err)
        })
    },
    signoutUser: async ({ commit }) => {
      // clean user in state
      commit('clearUser', null)
      // remove token in localstorage
      localStorage.setItem('token', '')
      // end session
      await apolloClient.resetStore()
      // redirect home kick users out of private pages (i.e profile)
      router.push('/')
    }
  },
  getters: {
    posts: state => state.posts,
    userPosts: state => state.userPosts,
    searchResults: state => state.searchResults,
    user: state => state.user,
    userFavorites: state => state.user && state.user.favorites,
    loading: state => state.loading,
    error: state => state.error,
    authError: state => state.authError
  },
  modules: {
  }
})
