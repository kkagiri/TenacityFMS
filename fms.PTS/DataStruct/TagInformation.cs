using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.PTS.DataStruct
{
    public class TagInformation
    {
        private string _tag;
        private string _name;
        private bool _valid;
        /// <summary>
        /// Tag getter and setter
        /// </summary>
        public string Tag
        {
            get { return _tag; }
            set { _tag = value; }
        }
        /// <summary>
        /// Name getter and setter
        /// </summary>
        public string Name
        {
            get { return _name; }
            set { _name = value; }
        }
        /// <summary>
        /// Valid getter and setter
        /// </summary>
        public bool Valid
        {
            get { return _valid; }
            set { _valid = value; }
        }
    }
}
