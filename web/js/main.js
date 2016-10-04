$(document).ready(function () {

    var petContent   = $('#petContent');

    $('#searchButton').click(function (e) {
        e.preventDefault(e);

        //Simple form validation
        if (!validate()) {
            return;
        }

        $('#pageOffset').val(0);
        $('.prevButton').prop('disabled', true);

        getPets();


    });

    $('.navButton').click(function (e) {
        e.preventDefault();

        if(!validate()) {
            return;
        }

        //I tried to store this locally instead of the form and it was not happy
        var offset = parseInt($('#pageOffset').val());

        if ($(this).hasClass('nextButton')) {
            offset += 25

        } else if ($(this).hasClass('prevButton')) {
            offset -= 25
        }

        $('#pageOffset').val(offset);

        $('.prevButton').prop('disabled', (offset <= 0));

        getPets();
    });

    function getPets() {

        //Remove all of the previous items
        petContent.find('.petColumn').remove();

        //Show the loading image
        resetBeforeSubmit();

        //Get data from the API
        $.getJSON(buildApiUri(), function (petApiData) {

            //We have our response, hide immediately (creates bounce effect of not hidden right away)
            $('#loadingImage').hide();

            //Check if we got any data
            if (checkResponse(petApiData)) {

                setupPets(petApiData.petfinder.pets.pet);
                $('.nextDiv').show();
            } else {
                $('#noPetsMessage').show();
            }



        });
    }

    function buildApiUri() {
        var query = 'http://api.petfinder.com/pet.find?key=e1c7900f743a4c461fd43601078532bf&location=' + encodeURIComponent($('#location').val());

        var animalType = $('#type').val();

        if (animalType != 'any') {
            query += '&animal=' + encodeURIComponent(animalType);
        }

        query += '&offset=' + parseInt($('#pageOffset').val());

        console.log(query);

        return query + '&callback=?&format=json';
    }

    function checkResponse(response) {
        //Make sure we have an actual response from the server
        if (response.petfinder !== undefined) {

            //Make sure we have pet data
            if (response.petfinder.pets !== undefined) {
                return true;
            }
        }

        return false;
    }

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

        var sex = (petData.sex.$t.toLowerCase() == 'm') ? 'Male' : 'Female';

        template.removeAttr('id'); //Remove the ID so we dont accidentally grab this next time around
        template.find('.petName a').text(petData.name.$t); //Pet name
        template.find('.petAttributes').text(petData.age.$t + ' - ' + sex + ' - ' + getSize(petData.size.$t)); //Misc Age - Gender - Size
        template.find('a').attr('data-target', '#moreInfo-' + petId); //Set a unique ID on the links so we can open the Modal

        //Modal Setup
        template.find('h4').text(petData.name.$t); //Pet Name
        template.find('.modalPetAttributes').text(petData.description.$t); //Long Text Description
        template.find('#moreInfo').attr('id', 'moreInfo-' + petId) //Set the modal ID so we can open it

        //Search through the photos and find the one with the correct size.
        if (petData.media.photos.photo !== undefined) {
            $.each(petData.media.photos.photo, function (index, photo) {

                if (photo['@size'] == 'pn') {
                    template.find('.petImage').attr('src', photo.$t);
                    return false; //Got one, stop looping
                }
            });
        }
    }



    function validate() {

        if ($('#location').val() == '' || $('#location').val() === undefined) {
            $("#errorMessage").text('Please input a valid location. Ex: Atlanta, GA or 30303').show();
            return false;
        }


        return true;

    }

    function resetBeforeSubmit() {
        $("#errorMessage").hide();
        $('#loadingImage').fadeIn();
        $('.nextDiv').hide();
        $('#noPetsMessage').hide();
    }

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

});