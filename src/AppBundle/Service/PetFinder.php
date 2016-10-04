<?php

namespace AppBundle\Service;


use Curl\Curl;
use Symfony\Component\Config\Definition\Exception\Exception;

/**
 * Class PetFinder
 * @package AppBundle\Service
 *
 * Built for use for the Petfinder.com API.
 * Documentation: https://www.petfinder.com/developers/api-docs
 */
class PetFinder
{

    protected  $apiUri = 'http://api.petfinder.com/';
	private $apiSecret = 'd69a88a1ccd0a2cf5187afa28e6968c6';
	protected $apiKey = 'e1c7900f743a4c461fd43601078532bf';

    protected $curl;

    public function __construct() {
        $this->curl = new Curl();
    }

    /**
     * @return string
     *
     * Documentation: https://www.petfinder.com/developers/api-docs#keys
     */
    public function auth() {
        //auth.getToken?key=12345&sig=333fda55007a750ef0c4cb792ee5f872

        //Make basic GET request
        $this->curl->get($this->apiUri . 'auth.getToken', [
                'key' => $this->apiKey,
                'sig' => $this->buildSignature(['key' => $this->apiKey])
            ]
        );

        //Check for ERRORS
        $this->checkError();

        //Return response if no errors
        return $this->curl->response;
    }

    public function search($location, $searchTerms = [], $offset = null, $limit = 25, ) {




    }

    /**
     * @param array $params
     * @return string
     *
     * Attaches the API Secret (provided by api) to the http query to create a
     * secure hash of the request for authentication purposes. Should be appended to
     * the end of every request.
     */
    protected function buildSignature(array $params) {
        //Format: Secret + query eg: abcdefkey=12345
        $paramString = $this->apiSecret . http_build_query($params);

        return md5($paramString);
    }

    /**
     * @throws Exception
     *
     * Check the last curl request for an error
     */
    protected function checkError() {
        if ($this->curl->error) {
            throw new Exception('Curl Error: ' . $this->curl->errorCode . ': ' . $this->curl->errorMessage);
        }
    }

}