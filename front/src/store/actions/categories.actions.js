import { categoryService } from "../../services/category.service"

export function getCategoryPlaylists(categoryId, categoryName) {
    return async (dispatch) => {
      try {
        const categoryPlaylists = await categoryService.getById(categoryId, categoryName)
        dispatch({ type: 'SET_CATEGORY_PLAYLISTS', playlists: categoryPlaylists })
      } catch (err) {
        console.log('err:', err)
      }
    }
  }
  
export function loadCategories(filterByOverride) {
    return async (dispatch, getState) => {
        try {
            console.log('getting categories')
            const stateFilter = getState().categoryModule.filterBy
            const filterBy = filterByOverride || stateFilter || { txt: 'HomePage' }
            const categories = await categoryService.query(filterBy)
            dispatch({ type: 'SET_CATEGORIES', categories })
        } catch (err) {
            console.log('err:', err)
        }
    }
}

export function addCategory() {

    let category = categoryService.getEmptyCategory()
    return async(dispatch) => {
        try {
            category = await categoryService.save(category)
            dispatch({ type: 'ADD_CATEGORY', category })
            return category
        } catch (err) {
            console.log('err:', err)
        }
    }
}

export function removeCategory(categoryId) {

    return async(dispatch) => {
        try {
            const categories = await categoryService.remove(categoryId)
            dispatch({ type: 'REMOVE_CATEGORY', categoryId })
            return 'hello'
        } catch (err) {
            console.log('err:', err)
        }
    }
}

export function setFilterBy(filterBy) {

    return (dispatch) => {
        try {
            dispatch({ type: 'SET_FILTER_BY', filterBy: {...filterBy } })
        } catch (err) {
            console.log('err:', err)
        }
    }
}

// export function get