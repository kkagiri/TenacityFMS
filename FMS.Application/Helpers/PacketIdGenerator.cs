namespace FMS.Application.Helpers
{
    public static class PacketIdGenerator
    {
        private static int _currentId = 0;

        private static readonly object _lock = new object();

        public static int GetNextId()
        {
            lock (_lock)
            {
                return ++_currentId;
            }
        }
    }
}