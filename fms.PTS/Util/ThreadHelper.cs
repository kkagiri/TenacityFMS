using System.Diagnostics;
using System.Threading;
namespace FMS.PTS.Util
{
    public class ThreadHelper
    {
             private Thread _thread;    

             private object _argumentObject;    
             private int _intervalBetweenLoops = -1 ;
             private object _threadLock = new object();

             private const int _closeTimeout = 5000;

             private CancellationTokenSource _cancellationTokenSource;

             ManualResetEvent _waitHandle;

        public event Action<object> ThreadFunctionEvent;

        public void SetIntervalBetweenLoops(int interval)
        {
            _intervalBetweenLoops = interval;
        }

        public void SetArgumentObject(object argumentObject)
        {
            _argumentObject = argumentObject;
        }

        public void Start()
        {
            Stop();
            _cancellationTokenSource = new CancellationTokenSource();
            _waitHandle = new ManualResetEvent(false);
            _thread  = new Thread(new ParameterizedThreadStart(ThreadFunc));
          object args = new object[2] { _cancellationTokenSource.Token, _argumentObject };
            _thread.Start(args);
        }

        public void Stop(int timeout = _closeTimeout)
        {
            if (_cancellationTokenSource != null)
            {
                _cancellationTokenSource.Cancel(false);
            }

            lock (_threadLock)
            {
                if (_cancellationTokenSource != null)
                {
                    if (_waitHandle != null)
                    {
                        _waitHandle.WaitOne(timeout);
                        _waitHandle.Close();
                        _waitHandle = null;
                    }

                    _thread = null;

                    _cancellationTokenSource.Dispose();
                    _cancellationTokenSource = null;
                }
            }
        }
          public void Clean()
        {
            Stop();
            ThreadFunctionEvent = null;
        }
      void ThreadFunc(object args)
        {
            Array argsArray = new object[3];
            argsArray = (Array)args;
            CancellationToken token = (CancellationToken)argsArray.GetValue(0);
            object argumentObject = argsArray.GetValue(1);
            while (!token.IsCancellationRequested)
            {
                if (Monitor.TryEnter(_threadLock))
                {
                    try
                    {
                        if (_thread != null)
                        {
                            Action<object> threadFunction = ThreadFunctionEvent;
                            if (threadFunction != null)
                            {
                                threadFunction(argumentObject);
                            }
                        }
                    }
                    finally
                    {
                        Monitor.Exit(_threadLock);
                    }

                    if (_intervalBetweenLoops < 0)
                    {
                        break;
                    }
                    else if (_intervalBetweenLoops > 0)
                    {
                        Thread.Sleep(_intervalBetweenLoops);
                    }
                }
            }

            if (_waitHandle != null)
            { 
                _waitHandle.Set();
            }

            lock (_threadLock)
            {
                Stop();
            }
        }

    }
}