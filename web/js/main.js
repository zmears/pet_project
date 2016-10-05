$(document).ready(function () {

    var petContent = $('#petContent');
    var petData    = []; //Holds current data on the page so we can sort
    var petBreeds  = [];


    $('#searchButton').click(function (e) {
        e.preventDefault(e);

        //Simple form validation
        if (!validate()) {
            return;
        }

        //Offset controls the current pagination offset
        $('#pageOffset').val(0);
        $('.prevButton').prop('disabled', true);

        //Call to the API to get a set of pet data
        getPets();
    });

    $('#randomButton').click(function (e) {
        e.preventDefault(e);

        //Simple form validation
        if (!validate()) {
            return;
        }

        //Offset controls the current pagination offset
        $('#pageOffset').val(0);
        $('.prevButton').prop('disabled', true);

        //Call to the API to get a set of pet data
        getPets('random');
    });

    $('.navButton').click(function (e) {
        e.preventDefault();

        if(!validate()) {
            return;
        }

        //I tried to store this locally instead of the form and it was not happy
        var offset = parseInt($('#pageOffset').val());

        //Determine if we are going forward or backward
        if ($(this).hasClass('nextButton')) {
            offset += 25

        } else if ($(this).hasClass('prevButton')) {
            offset -= 25
        }

        //save the offset
        $('#pageOffset').val(offset);

        //Past page 1?
        $('.prevButton').prop('disabled', (offset <= 0));

        //get the next set of pet data
        getPets();
    });

    function getPets(apiRequestType) {

        clearPets();

        //Show the loading image
        resetBeforeSubmit(apiRequestType);

        //Get data from the API
        $.getJSON(buildApiUri(apiRequestType), function (petApiData) {

            //We have our response, hide immediately (creates bounce effect of not hidden right away)
            $('#loadingImage').hide();

            //Check if we got any data
            if (checkResponse(petApiData)) {

                //Add the pet data using our template
                setupPets(petData);

                if (petData.length == 1) {
                    $('#petContent .petColumn').attr('class', 'petColumn');
                    hideNav();
                } else {
                    //Show the nav options (next/prev/sort)
                    showNav();
                }
            } else {
                $('#noPetsMessage').show();
            }



        });
    }

    function buildApiUri(apiRequestType) {
        //The only thing required is a location

        var methodCall = 'pet.find';
        switch (apiRequestType) {
            case 'random':
                methodCall = 'pet.getRandom';
                break;
            case 'breed':
                methodCall = 'breed.list';
                break;
            default:
                methodCall = 'pet.find';
        }

        var query = 'http://api.petfinder.com/'+ methodCall +'?key=e1c7900f743a4c461fd43601078532bf&location=' + encodeURIComponent($('#location').val());


        //Add any sub options
        var animalType = $('#type').val();
        if (animalType != 'any') {
            query += '&animal=' + encodeURIComponent(animalType);
        }

        var animalBreed = $('#breed').val();
        if (animalBreed != 'any') {
            query += '&breed=' + encodeURIComponent(animalBreed);
        }

        //Easier to read than one big line
        query += '&offset=' + parseInt($('#pageOffset').val());
        query += '&callback=?&output=full&format=json';

        console.log(query);

        //callback is required and set our response format to JSON for easier parsing
        return query;
    }

    $('#type').change(function () {
        $('#breed option').remove();
        addAnyBreed();

        clearPets();

        getBreeds($(this).val());

        //Trigger Search
        $('#searchButton').click();
    });

    $('#breed').change(function() {
        //Trigger Search
        $('#searchButton').click();
    });
    
    function getBreeds(type) {
        var query = buildApiUri('breed');

        $.getJSON(buildApiUri('breed'), function (apiResponse) {

            if (apiResponse.petfinder !== undefined) {
                if (apiResponse.petfinder.breeds !== undefined) {
                    if (apiResponse.petfinder.breeds.breed !== undefined) {
                        if (apiResponse.petfinder.breeds.breed.length > 0) {

                            $.each(apiResponse.petfinder.breeds.breed, function(index, breed) {

                                if (breed.$t !== undefined) {

                                    $('#breed').append('<option value="' + breed.$t.toLowerCase() + '">' + breed.$t + '</option>');

                                    petBreeds.push(breed.$t);
                                }

                            });


                        }
                    }
                }
            }


        });
    }

    function addAnyBreed() {
        $('#breed').append('<option value="any">Breed - Any</option>');
    }

    function checkResponse(response) {
        //Make sure we have an actual response from the server
        if (response.petfinder !== undefined) {

            //Make sure we have pet data
            if (response.petfinder.pets !== undefined) {
                petData = response.petfinder.pets.pet;
                return true;
            }

            if (response.petfinder.pet !== undefined) {
                petData = [response.petfinder.pet];
                return true;
            }
        }

        return false;
    }

    //Easier toggling
    function showNav() {
        $('#sortDiv').show();
        $('.nextDiv').show();
    }

    function hideNav() {
        $('#sortDiv').hide();
        $('.nextDiv').hide();
    }

    //Setups up the template for each pet
    function setupPets(petArray) {


        //Add pets
        $.each(petArray, function (index, petData) {
            //Create a fresh copy of our template
            var template = $('#displayTemplate').clone();

            //Add the data to our little template
            populateTemplate(index, petData, template);

            //Here we have to do a little magic so our tiles don't get misaligned
            checkClearFix(index, petContent);

            //Append our newly created template
            petContent.append(template);

            //Fade in for nice effect
            template.fadeIn();

        });

    }

    function populateTemplate(petId, petData, template) {

        //Populate the templates data

        var sex = 'N/A';
        switch (petData.sex.$t.toLowerCase()) {
            case 'm':
                sex = 'Male';
                break;
            case 'f':
                sex = 'Female';
                break;
            default:
                sex = 'N/A';
        }

        template.removeAttr('id'); //Remove the ID so we dont accidentally grab this next time around
        template.find('.petName a').text(petData.name.$t); //Pet name
        template.find('.petAttributes').text(petData.age.$t + ' - ' + sex + ' - ' + getSize(petData.size.$t)); //Misc Age - Gender - Size
        template.find('a').attr('data-target', '#moreInfo-' + petId); //Set a unique ID on the links so we can open the Modal

        //Modal Setup
        template.find('h4').text(petData.name.$t); //Pet Name
        template.find('.modalPetAttributes').text(petData.description.$t); //Long Text Description
        template.find('#moreInfo').attr('id', 'moreInfo-' + petId) //Set the modal ID so we can open it

        //Search through the photos and find the one with the correct size.
        if (petData.media.photos !== undefined) {
            if (petData.media.photos.photo !== undefined) {
                $.each(petData.media.photos.photo, function (index, photo) {

                    if (photo['@size'] == 'pn') {
                        template.find('.petImage').attr('src', photo.$t);
                        return false; //Got one, stop looping
                    }
                });
            }    
        }
        
    }


    //Simple form validation
    function validate() {

        //Location is the only required item for the api
        if ($('#location').val() == '' || $('#location').val() === undefined) {
            $("#errorMessage").text('Please input a valid location. Ex: Atlanta, GA or 30303').show();
            return false;
        }


        return true;

    }

    //Toggle a few items when the user clicks search
    function resetBeforeSubmit() {
        $("#errorMessage").hide();
        $('#loadingImage').fadeIn();
        $('#noPetsMessage').hide();

        hideNav();
    }

    function clearPets() {
        //Remove all of the previous items
        petContent.find('.petColumn').remove();
        petContent.find('.clearfix').remove();
    }

    //Convert pet size from shorthand to long
    function getSize(size) {
        switch (size.toLowerCase()) {
            case 's':
                return 'Small';
            case 'm':
                return 'Medium';
            case 'l':
                return 'Large';
            case 'xl':
                return 'Extra-Large';
            default:
                return 'N/A';
        }
    }


    //We need to add a clear every so often so our tiles line up properly
    function checkClearFix(index, template) {
        if(index % 2 == 0) {
            template.append('<div class="clearfix visible-sm-block"></div>');
        }
        if(index % 3 == 0) {
            template.append('<div class="clearfix visible-md-block"></div>');
        }
        if(index % 4 == 0) {
            template.append('<div class="clearfix visible-lg-block"></div>');
        }
    }


    //Keep track of the direction we are sorting
    var ascending = false;

    //Simple sorting (Maybe the API can sort?)
    $('.sortBy').click(function (e) {
        e.preventDefault();

        if (petData.count == 0) {
            return;
        }

        var sortBy = $(this).text().toLowerCase();

        console.log(sortBy);

        switch (sortBy) {
            case 'name':
                sortPets('name');
                break;
            case 'gender':
                sortPets('sex');
                break;
            case 'size':
                sortPets('size');
                break;
            default:
                break;
        }

        //Set the sorting text on the dropdown so the user knows
        var sortingDirText = (ascending) ? ' ASC' : ' DESC';
        var sortingText    = $(this).attr('data-default') + sortingDirText;

        $('#sortingButton').text(sortingText);
    });

    function sortPets(field) {

        //Swap the sorting
        ascending = !ascending;

        console.log(ascending);

        petData.sort(function (a, b) {

            //Fields are swapped based on sorting direction
            var aName = ascending ? a[field].$t.toLowerCase() : b[field].$t.toLowerCase();
            var bName = ascending ? b[field].$t.toLowerCase() : a[field].$t.toLowerCase();

            if (aName < bName) {
                return -1;
            }

            if (aName > bName) {
                return 1;
            }

            return 0;
        })

        //Remove all the items and re-add them.
        petContent.find('.petColumn').remove();
        setupPets(petData);

        //TODO: Maybe we can iterate the tiles instead of the pet data so we dont have to recreate them
    }

});