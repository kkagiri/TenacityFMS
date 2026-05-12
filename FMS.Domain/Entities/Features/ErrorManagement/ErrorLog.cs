namespace FMS.Domain.Entities.Features.ErrorManagement
{
    public class ErrorLog
    {
        public Guid Id { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Message { get; set; }
        public string Stack { get; set; }
        public string ComponentStack { get; set; }
        public string UserAgent { get; set; }
        public string Url { get; set; }
        public string UserId { get; set; }

    }
}