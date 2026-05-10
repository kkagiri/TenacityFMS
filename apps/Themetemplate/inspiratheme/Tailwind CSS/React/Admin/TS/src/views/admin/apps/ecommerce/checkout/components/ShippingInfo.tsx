import { PatternFormat } from 'react-number-format'

const ShippingInfo = () => {
  return (
    <>
      <h5 className="my-1.5 text-md">Saved Address</h5>
      <p className="text-default-400 mb-7.5">Provide your address details to receive the order invoice.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-base mb-base">
        <div className="border-default-300 peer-checked:border-primary relative rounded-md border p-5">
          <input className="form-radio peer absolute end-2 bottom-2 rounded-full!" type="radio" name="deli-address" id="add-home" defaultChecked />
          <label className="form-check-label w-full" htmlFor="add-home">
            <span className="text-default-400 mb-1.25 block font-bold uppercase">Home</span>
            <span className="block font-semibold">Evelyn Carter</span>
            2418 Maple Street, Apt 12B
            <br />
            Brooklyn, NY 11215
            <br />
            <abbr title="Phone">P:</abbr>
            (917) 432-7784
            <br />
          </label>
        </div>
        <div>
          <div className="border-default-300 peer-checked:border-primary relative rounded-md border p-5">
            <input className="form-radio peer absolute end-2 bottom-2 rounded-full!" type="radio" name="deli-address" id="add-office" />
            <label className="form-check-label w-full" htmlFor="add-office">
              <span className="text-default-400 mb-1.25 block font-bold uppercase">Office</span>
              <span className="block font-semibold">Marcus Reynolds</span>
              500 Howard Street, Floor 8
              <br />
              San Francisco, CA 94105
              <br />
              <abbr title="Phone">P:</abbr>
              (415) 392-6400
              <br />
            </label>
          </div>
        </div>
      </div>
      <h5 className="my-1.25 text-md">Add New Address</h5>
      <p className="text-default-400 mb-7.5">Provide your address details to receive the order invoice.</p>
      <form>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-base mb-base ">
          <div>
            <label htmlFor="shipping-add-first-name" className="mb-2 block">
              First Name
            </label>
            <input className="form-input" type="text" placeholder="Enter your first name" id="shipping-add-first-name" />
          </div>
          <div>
            <label htmlFor="shipping-add-last-name" className="mb-2 block">
              Last Name
            </label>
            <input className="form-input" type="text" placeholder="Enter your last name" id="shipping-add-last-name" />
          </div>
          <div>
            <label htmlFor="shipping-add-email-address" className="mb-2 block">
              Email
              <span className="text-danger">*</span>
            </label>
            <input className="form-input" type="email" placeholder="Enter your email" id="shipping-add-email-address" />
          </div>
          <div>
            <label htmlFor="shipping-add-phone" className="mb-2 block">
              Phone
              <span className="text-danger">*</span>
            </label>
            <PatternFormat mask="_" format="(##) ### #### ###" className="form-input" type="text" placeholder="(xx) xxx xxxx xxx" id="shipping-add-phone" />
          </div>
          <div className="col-span-1 md:col-span-2">
            <label htmlFor="shipping-add-address" className="mb-2 block">
              Address
              <span className="text-danger">*</span>
            </label>
            <textarea className="form-textarea" id="shipping-add-address" rows={2} placeholder="Enter your address" defaultValue={''} />
          </div>
        </div>
        {/* end row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-base mb-base">
          <div>
            <label htmlFor="shipping-add-town-city" className="mb-2 block">
              Town / City
            </label>
            <input className="form-input" type="text" placeholder="Enter your city name" id="shipping-add-town-city" />
          </div>
          <div>
            <label htmlFor="shipping-add-state" className="mb-2 block">
              State
            </label>
            <input className="form-input" type="text" placeholder="Enter your state" id="shipping-add-state" />
          </div>
          <div>
            <label htmlFor="shipping-add-zip-postal" className="mb-2 block">
              Zip / Postal Code
            </label>
            <PatternFormat mask="_" format="### ###" className="form-input" type="text" placeholder="Enter your zip code" id="shipping-add-zip-postal" />
          </div>
        </div>
        {/* end row */}
        <div className="grid grid-cols-1 mb-base ">
          <div>
            <label className="mb-2 block">Country</label>
            <select className="form-select">
              <option value={0}>Select Country</option>
              <option value="AF">Afghanistan</option>
              <option value="AL">Albania</option>
              <option value="DZ">Algeria</option>
              <option value="AS">American Samoa</option>
              <option value="AD">Andorra</option>
              <option value="AO">Angola</option>
              <option value="AI">Anguilla</option>
              <option value="AQ">Antarctica</option>
              <option value="AR">Argentina</option>
              <option value="AM">Armenia</option>
              <option value="AW">Aruba</option>
              <option value="AU">Australia</option>
              <option value="AT">Austria</option>
              <option value="AZ">Azerbaijan</option>
              <option value="BS">Bahamas</option>
              <option value="BH">Bahrain</option>
              <option value="BD">Bangladesh</option>
              <option value="BB">Barbados</option>
              <option value="BY">Belarus</option>
              <option value="BE">Belgium</option>
              <option value="BZ">Belize</option>
              <option value="BJ">Benin</option>
              <option value="BM">Bermuda</option>
              <option value="BT">Bhutan</option>
              <option value="BO">Bolivia</option>
              <option value="BW">Botswana</option>
              <option value="BV">Bouvet Island</option>
              <option value="BR">Brazil</option>
              <option value="BN">Brunei Darussalam</option>
              <option value="BG">Bulgaria</option>
              <option value="BF">Burkina Faso</option>
              <option value="BI">Burundi</option>
              <option value="KH">Cambodia</option>
              <option value="CM">Cameroon</option>
              <option value="CA">Canada</option>
              <option value="CV">Cape Verde</option>
              <option value="KY">Cayman Islands</option>
              <option value="CF">Central African Republic</option>
              <option value="TD">Chad</option>
              <option value="CL">Chile</option>
              <option value="CN">China</option>
              <option value="CX">Christmas Island</option>
              <option value="CC">Cocos (Keeling) Islands</option>
              <option value="CO">Colombia</option>
              <option value="KM">Comoros</option>
              <option value="CG">Congo</option>
              <option value="CK">Cook Islands</option>
              <option value="CR">Costa Rica</option>
              <option value="CI">Cote d&apos;Ivoire</option>
              <option value="HR">Croatia (Hrvatska)</option>
              <option value="CU">Cuba</option>
              <option value="CY">Cyprus</option>
              <option value="CZ">Czech Republic</option>
              <option value="DK">Denmark</option>
              <option value="DJ">Djibouti</option>
              <option value="DM">Dominica</option>
              <option value="DO">Dominican Republic</option>
              <option value="EC">Ecuador</option>
              <option value="EG">Egypt</option>
              <option value="SV">El Salvador</option>
              <option value="GQ">Equatorial Guinea</option>
              <option value="ER">Eritrea</option>
              <option value="EE">Estonia</option>
              <option value="ET">Ethiopia</option>
              <option value="FK">Falkland Islands (Malvinas)</option>
              <option value="FO">Faroe Islands</option>
              <option value="FJ">Fiji</option>
              <option value="FI">Finland</option>
              <option value="FR">France</option>
              <option value="GF">French Guiana</option>
              <option value="PF">French Polynesia</option>
              <option value="GA">Gabon</option>
              <option value="GM">Gambia</option>
              <option value="GE">Georgia</option>
              <option value="DE">Germany</option>
              <option value="GH">Ghana</option>
              <option value="GI">Gibraltar</option>
              <option value="GR">Greece</option>
              <option value="GL">Greenland</option>
              <option value="GD">Grenada</option>
              <option value="GP">Guadeloupe</option>
              <option value="GU">Guam</option>
              <option value="GT">Guatemala</option>
              <option value="GN">Guinea</option>
              <option value="GW">Guinea-Bissau</option>
              <option value="GY">Guyana</option>
              <option value="HT">Haiti</option>
              <option value="HN">Honduras</option>
              <option value="HK">Hong Kong</option>
              <option value="HU">Hungary</option>
              <option value="IS">Iceland</option>
              <option value="IN">India</option>
              <option value="ID">Indonesia</option>
              <option value="IQ">Iraq</option>
              <option value="IE">Ireland</option>
              <option value="IL">Israel</option>
              <option value="IT">Italy</option>
              <option value="JM">Jamaica</option>
              <option value="JP">Japan</option>
              <option value="JO">Jordan</option>
              <option value="KZ">Kazakhstan</option>
              <option value="KE">Kenya</option>
              <option value="KI">Kiribati</option>
              <option value="KR">Korea, Republic of</option>
              <option value="KW">Kuwait</option>
              <option value="KG">Kyrgyzstan</option>
              <option value="LV">Latvia</option>
              <option value="LB">Lebanon</option>
              <option value="LS">Lesotho</option>
              <option value="LR">Liberia</option>
              <option value="LY">Libyan Arab Jamahiriya</option>
              <option value="LI">Liechtenstein</option>
              <option value="LT">Lithuania</option>
              <option value="LU">Luxembourg</option>
              <option value="MO">Macau</option>
              <option value="MG">Madagascar</option>
              <option value="MW">Malawi</option>
              <option value="MY">Malaysia</option>
              <option value="MV">Maldives</option>
              <option value="ML">Mali</option>
              <option value="MT">Malta</option>
              <option value="MH">Marshall Islands</option>
              <option value="MQ">Martinique</option>
              <option value="MR">Mauritania</option>
              <option value="MU">Mauritius</option>
              <option value="YT">Mayotte</option>
              <option value="MX">Mexico</option>
              <option value="MD">Moldova, Republic of</option>
              <option value="MC">Monaco</option>
              <option value="MN">Mongolia</option>
              <option value="MS">Montserrat</option>
              <option value="MA">Morocco</option>
              <option value="MZ">Mozambique</option>
              <option value="MM">Myanmar</option>
              <option value="NA">Namibia</option>
              <option value="NR">Nauru</option>
              <option value="NP">Nepal</option>
              <option value="NL">Netherlands</option>
              <option value="AN">Netherlands Antilles</option>
              <option value="NC">New Caledonia</option>
              <option value="NZ">New Zealand</option>
              <option value="NI">Nicaragua</option>
              <option value="NE">Niger</option>
              <option value="NG">Nigeria</option>
              <option value="NU">Niue</option>
              <option value="NF">Norfolk Island</option>
              <option value="MP">Northern Mariana Islands</option>
              <option value="NO">Norway</option>
              <option value="OM">Oman</option>
              <option value="PW">Palau</option>
              <option value="PA">Panama</option>
              <option value="PG">Papua New Guinea</option>
              <option value="PY">Paraguay</option>
              <option value="PE">Peru</option>
              <option value="PH">Philippines</option>
              <option value="PN">Pitcairn</option>
              <option value="PL">Poland</option>
              <option value="PT">Portugal</option>
              <option value="PR">Puerto Rico</option>
              <option value="QA">Qatar</option>
              <option value="RE">Reunion</option>
              <option value="RO">Romania</option>
              <option value="RU">Russian Federation</option>
              <option value="RW">Rwanda</option>
              <option value="KN">Saint Kitts and Nevis</option>
              <option value="LC">Saint LUCIA</option>
              <option value="WS">Samoa</option>
              <option value="SM">San Marino</option>
              <option value="ST">Sao Tome and Principe</option>
              <option value="SA">Saudi Arabia</option>
              <option value="SN">Senegal</option>
              <option value="SC">Seychelles</option>
              <option value="SL">Sierra Leone</option>
              <option value="SG">Singapore</option>
              <option value="SK">Slovakia (Slovak Republic)</option>
              <option value="SI">Slovenia</option>
              <option value="SB">Solomon Islands</option>
              <option value="SO">Somalia</option>
              <option value="ZA">South Africa</option>
              <option value="ES">Spain</option>
              <option value="LK">Sri Lanka</option>
              <option value="SH">St. Helena</option>
              <option value="PM">St. Pierre and Miquelon</option>
              <option value="SD">Sudan</option>
              <option value="SR">Suriname</option>
              <option value="SZ">Swaziland</option>
              <option value="SE">Sweden</option>
              <option value="CH">Switzerland</option>
              <option value="SY">Syrian Arab Republic</option>
              <option value="TW">Taiwan, Province of China</option>
              <option value="TJ">Tajikistan</option>
              <option value="TZ">Tanzania, United Republic of</option>
              <option value="TH">Thailand</option>
              <option value="TG">Togo</option>
              <option value="TK">Tokelau</option>
              <option value="TO">Tonga</option>
              <option value="TT">Trinidad and Tobago</option>
              <option value="TN">Tunisia</option>
              <option value="TR">Turkey</option>
              <option value="TM">Turkmenistan</option>
              <option value="TC">Turks and Caicos Islands</option>
              <option value="TV">Tuvalu</option>
              <option value="UG">Uganda</option>
              <option value="UA">Ukraine</option>
              <option value="AE">United Arab Emirates</option>
              <option value="GB">United Kingdom</option>
              <option value="US">United States</option>
              <option value="UY">Uruguay</option>
              <option value="UZ">Uzbekistan</option>
              <option value="VU">Vanuatu</option>
              <option value="VE">Venezuela</option>
              <option value="VN">Viet Nam</option>
              <option value="VG">Virgin Islands (British)</option>
              <option value="VI">Virgin Islands (U.S.)</option>
              <option value="WF">Wallis and Futuna Islands</option>
              <option value="EH">Western Sahara</option>
              <option value="YE">Yemen</option>
              <option value="ZM">Zambia</option>
              <option value="ZW">Zimbabwe</option>
            </select>
          </div>
        </div>
        {/* end row */}
        <div className="flex justify-end">
          <button type="button" className="btn btn-sm bg-success text-white">
            Save
          </button>
        </div>
      </form>
      <h5 className="my-1.5 text-md">Shipping Method</h5>
      <p className="text-default-400 mb-5">Choose your preferred shipping method to receive your order on time.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-base mb-base">
        <div className="border-default-300 rounded border p-5">
          <div className="flex gap-2">
            <input type="radio" id="shippingMethodRadio1" name="shippingOptions" className="form-radio rounded-full!" defaultChecked />
            <label className="form-check-label font-bold" htmlFor="shippingMethodRadio1">
              Standard Delivery - FREE
            </label>
          </div>
          <p className="text-default-400 ps-base pt-1.25">Estimated 5-7 days shipping (Duties and tax may be due upon delivery)</p>
        </div>
        <div className="border-default-300 rounded border p-5">
          <div className="flex gap-2">
            <input type="radio" id="shippingMethodRadio2" name="shippingOptions" className="form-radio rounded-full!" />
            <label className="form-check-label font-bold" htmlFor="shippingMethodRadio2">
              Fast Delivery - $25
            </label>
          </div>
          <p className="text-default-400 ps-base pt-1.25">Estimated 1-2 days shipping (Duties and tax may be due upon delivery)</p>
        </div>
      </div>
    </>
  )
}

export default ShippingInfo
