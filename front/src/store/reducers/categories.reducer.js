const INITIAL_STATE = {
    categories: null,
    catagoryPlaylists: null,
    filterBy: {},
}


export function categoryReducer(state = INITIAL_STATE, action) {
    // debugger
    switch (action.type) {
        case 'SET_CATEGORIES':
            return {
                ...state,
                categories: [...action.categories]
            }
        case 'SET_CATEGORY_PLAYLISTS':
            return {
                ...state,
                catagoryPlaylists: [...action.playlists]
            }
        case 'ADD_CATEGORY':
            return {
                ...state,
                categories: [action.category, ...state.categories]
            }
        case 'REMOVE_CATEGORY':
            return {
                ...state,
                categories: state.categories.filter(category => category._id !== action.categoryId)
            }
        case 'UPDATE_CATEGORY':
            return {
                ...state,
                categories: state.categories.map(category => category._id === action.category._id ? action.category : category)
            }
        case 'SET_FILTER_BY':
            return {
                ...state,
                filterBy: {...action.filterBy }
            }

        default:
            return state
    }

}