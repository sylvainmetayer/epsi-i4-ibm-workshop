function onAddRepair(addRepair) {
    return isValidLogin(addRepair.password, addRepair.car.owner.email)
        .then(function (authorized) {
            if (authorized == false) {
                throw new Error("Unauthorized");
            }

            price = addRepair.repairPrice;
            description = addRepair.description;

            if (addRepair.car.repair == undefined) {
                addRepair.car.repair = new Array();
            }

            return getAssetRegistry("com.epsi.blockchain.Repair")
                .then(function (repairRegistry) {
                    factory = getFactory();
                    repair = factory.newResource("com.epsi.blockchain", "Repair", "repairID:" + addRepair.car.numberplate + "-" + addRepair.car.repair.length)
                    repair.repair = description;
                    repair.price = price;
                    repair.car = factory.newRelationship("com.epsi.blockchain", "Car", addRepair.car.numberplate);
                    repair.date = new Date().toDateString();

                    return repairRegistry.add(repair)
                        .then(function () {
                            addRepair.car.repair.push(repair);

                            return getAssetRegistry("com.epsi.blockchain.Car")
                                .then(function (assetRegistry) {
                                    return assetRegistry.update(addRepair.car)
                                });
                        })
                });
        });
}


function onSellCar(sellCar) {
    return isValidLogin(sellCar.password, sellCar.buyer.email)
        .then(function (authorized) {
            if (authorized == false) {
                throw new Error("Unauthorized");
            }

            if (sellCar.car.status != "OK") {
                throw new Error("Car is already in a negociation, come back later");
            }

            price = sellCar.price;
            km = sellCar.km;

            if (sellCar.car.price < price) {
                message = "Price is too high !";
                throw new Error(message);
            }

            if (sellCar.car.km > km) {
                message = "The KM indicated are not correct." + km + "(now) > " + sellCar.car.km + "(original) ?";
                throw new Error(message);
            }

            if (sellCar.seller != sellCar.car.owner) {
                message = "Seller is not owner of this car ! (seller)" + sellCar.seller + " / (owner)" + sellCar.car.owner;
                throw new Error(message);
            }

            sellCar.car.propositionPrice = price;
            sellCar.car.propositionKM = km;
            sellCar.car.propositionBuyer = sellCar.buyer;
            sellCar.car.status = "PENDING";

            return getAssetRegistry("com.epsi.blockchain.Car")
                .then(function (assetRegistry) {
                    return assetRegistry.update(sellCar.car);
                });
        });
}

function onHandleProposition(handleProposition) {
    return isValidLogin(handleProposition.password, handleProposition.car.owner.email)
        .then(function (authorized) {
            if (authorized == false) {
                throw new Error("Unauthorized");
            }

            if (handleProposition.car.status == "OK") {
                throw new Error("No proposition to handle !");
            }

            if (handleProposition.status == "OK") {
                handleProposition.car.status = "OK";
                if (handleProposition.car.previousOwners == undefined) {
                    handleProposition.car.previousOwners = new Array();
                }

                factory = getFactory();
                handleProposition.car.previousOwners.push(factory.newRelationship("com.epsi.blockchain", "Person", handleProposition.car.owner.email));
                handleProposition.car.km = handleProposition.car.propositionKM;
                handleProposition.car.price = handleProposition.car.propositionPrice;
                handleProposition.car.owner = handleProposition.car.propositionBuyer;
            }

            handleProposition.car.status = "OK";
            handleProposition.car.propositionBuyer = undefined;
            handleProposition.car.propositionKM = 0;
            handleProposition.car.propositionPrice = 0;

            return getAssetRegistry("com.epsi.blockchain.Car")
                .then(function (assetRegistry) {
                    return assetRegistry.update(handleProposition.car);
                });

        });
}

function isValidLogin(password, seller) {
    return getParticipantRegistry("com.epsi.blockchain.Person")
        .then(function (participantRegistry) {
            return participantRegistry.getAll();
        })
        .then(function (participants) {
            for (var i = 0; i < participants.length; i++) {
                person = participants[i];
                if (person.password == password && seller == person.email) {
                    return true;
                }
            }
            return false;
        });
}
