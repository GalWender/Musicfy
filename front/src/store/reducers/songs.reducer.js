const INITIAL_STATE = {
    items: null,
    currSong: {
        addedAt: '2023-04-11T18:10:48Z',
        title: 'Call Me Maybe',
        artist: 'Carly Rae Jepsen',
        album: 'Kiss (Deluxe)',
        imgUrl: 'https://i.scdn.co/image/ab67616d0000b273a111f7769013f1731e9c697c',
        id: 'A_MjCqQoLLA'
    },
    filterBy: {

    }
}


export function songReducer(state = INITIAL_STATE, action) {
    switch (action.type) {
        case 'SET_ITEMS':
            return {
                ...state,
                items: [...action.items]
            }
        case 'ADD_ITEM':
            return {
                ...state,
                items: [...state.items, action.item]
            }
        case 'REMOVE_ITEM':
            return {
                ...state,
                items: state.items.filter(item => item._id !== action.itemId)
            }
        case 'UPDATE_ITEM':
            return {
                ...state,
                items: state.items.map(item => item._id === action.item._id ? action.item : item)
            }
        case 'SET_FILTER_BY':
            return {
                ...state,
                filterBy: { ...action.filterBy }
            }

        default:
            return state
    }

}