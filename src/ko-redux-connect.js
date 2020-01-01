define(['knockout'],
    function (ko) {
        var connect = function connect(store) {
            return function (stateToProps, dispatchToProps) {
                return function (ViewModel) {
                    var initialState = store.getState();
                    var initialProps = stateToProps(initialState);

                    var vm = new ViewModel(Object.assign({}, initialProps, dispatchToProps(store.dispatch)));

                    store.subscribe(function () {
                        var state = store.getState();
                        var props = Object.assign({}, stateToProps(state), dispatchToProps(store.dispatch));

                        Object.keys(vm).filter(function (key) {
                            return ko.isObservable(vm[key]) && !ko.isComputed(vm[key]);
                        }).forEach(function (key) {
                            if (props[key]) {
                                vm[key](props[key]);
                            }
                        });
                    });

                    return vm;
                };
            };
        };

        function ReduxKoConnector() {
            var self = this;

            self.connect = connect;
            self.vmConnect = function (obj) {
                return connect(obj.store)(obj.stateToProps, obj.dispatchToProps)(obj.vm);
            };
        }

        return new ReduxKoConnector();
    }
);
