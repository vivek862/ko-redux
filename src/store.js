define(['redux'],
    function (redux) {
        var _combineReducers = redux.combineReducers;

        function _createReducer(asyncReducers) {
            var reducers = Object.assign({}, asyncReducers);
            return _combineReducers(reducers);
        }

        function _createStore(reducer, state) {
            return redux.createStore(reducer, state);
        }

        function StoreUtility() {
            var self = this;
            self.Store = null;

            self.configureStore = function (initialState) {
                self.Store = _createStore(_createReducer(), initialState);
                self.Store.asyncReducers = {};

                return self.Store;
            };

            self.injectAsyncReducer = function (store, name, asyncReducer) {
                self.Store.asyncReducers[name] = asyncReducer;
                self.Store.replaceReducer(_createReducer(store.asyncReducers));
            };

            self.createStore = function (reducer) {
                var store = self.getStore();

                if (store) {
                    return store;
                }

                self.Store = _createStore(reducer);
                window.redux.app.Store = self.Store;

                return self.Store;
            };

            self.getStore = function () {
                return (window.redux && window.redux.app && window.redux.app.Store) || self.Store;
            };

            self.getState = function () {
                var store = self.getStore();
                return store.getState();
            };

            /*
             * Add UNDO and REDO actions to your reducer.
             */
            self.UNDO = 'UNDO';
            self.REDO = 'REDO';
            self.CLEAR = 'CLEARHISTORY';
            self.undoEnhancer = function (targetReducer, maxHistory) {
                var max = (maxHistory === undefined) ? 10000 : maxHistory;
                var initialState = {
                    past: [],
                    present: undefined,
                    future: []
                };

                return function (input, action) {
                    var state = input || initialState;
                    var past = state.past;
                    var present = state.present;
                    var future = state.future;
                    var finalState = {};

                    if (action.type === self.UNDO) {
                        // Take present and add to future if we plan on switching present to the last past
                        if (present !== undefined && present !== null && past.length > 0) {
                            future.push(present);
                        }
                        // Present becomes last past if there is any past
                        if (past.length > 0) {
                            present = past.pop();
                        }
                        // Else everything stays just as they were

                        finalState = {
                            past: past,
                            present: present,
                            future: future
                        };
                    } else if (action.type === self.REDO) {
                        // move present to end of past
                        // move first future to present
                        if (present !== undefined && present !== null && future.length > 0) {
                            past.push(present);
                        }

                        if (future.length > 0) {
                            present = future.pop();
                        }

                        finalState = {
                            past: past,
                            present: present,
                            future: future
                        };
                    } else if (action.type === self.CLEAR) {
                        // move present to end of past
                        // move first future to present
                        past = [];
                        future = [];

                        finalState = {
                            past: past,
                            present: present,
                            future: future
                        };
                    } else {
                        var newPresent = targetReducer(present, action);
                        if (present === newPresent) {
                            return state;
                        }
                        if (present) {
                            past.push(present);
                            // Do not let us add more than the max amount of history.
                            if (past.length > max) {
                                past.shift();
                            }
                        }

                        finalState = {
                            past: past,
                            present: newPresent,
                            future: []
                        };
                    }

                    return finalState;
                };
            };
        }

        return new StoreUtility();
    }
);
