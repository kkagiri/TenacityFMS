using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Services.Models.PTSModels
{
    public class ReaderTag
    {
        private int _reader;
        private string _tag;
        private bool _online;
        private bool _error;
        /// <summary>
        /// Reader getter and setter
        /// </summary>
        public int Reader
        {
            get { return _reader; }
            set { _reader = value; }
        }
        /// <summary>
        /// Tag getter and setter : to do link this to the tag model in Fms.Domain.Entities
        /// </summary>
        public string Tag
        {
            get { return _tag; }
            set { _tag = value; }
        }
        /// <summary>
        /// Online getter and setter
        /// </summary>
        public bool Online
        {
            get { return _online; }
            set { _online = value; }
        }
        /// <summary>
        /// Error getter and setter
        /// </summary>
        public bool Error
        {
            get { return _error; }
            set { _error = value; }
        }
    }
}
