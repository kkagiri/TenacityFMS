// using System;
// using System.Threading;
// using System.Threading.Tasks;
// using AutoMapper;
// using FMS.Application.ModelsDTOs.FMS.Vehicle;
// using FMS.Application.Queries.Database.FMSQuery.VehicleQuery;
// using FMS.Domain.Entities;
// using FMS.Persistence.DataAccess;
// using Microsoft.EntityFrameworkCore;
// using Microsoft.Extensions.Logging;
// using Moq;
// using Xunit;

// namespace FMS.Testing {
//     public class GetVehicleByIDQueryTest {
//         private readonly Mock<GpsdataContext> _mockContext;
//         private readonly Mock<IMapper> _mockMapper;
//         private readonly Mock<ILogger<GetVehicleByIDQueryHandler>> _mockLogger;
//         private readonly GetVehicleByIDQueryHandler _handler;

//         public GetVehicleByIDQueryTest () {
//             _mockContext = new Mock<GpsdataContext> ();
//             _mockMapper = new Mock<IMapper> ();
//             _mockLogger = new Mock<ILogger<GetVehicleByIDQueryHandler>> ();
//             _handler = new GetVehicleByIDQueryHandler (_mockContext.Object, _mockMapper.Object, _mockLogger.Object);
//         }

//         [Fact]
//         public async Task Handle_ValidId_ReturnsVehicleDTO () {
//             // Arrange
//             int vehicleId = 43;
//             var vehicle = new Vehicle { VehicleId = vehicleId, VehicleCode = "TEST123" };
//             var vehicleDTO = new VehicleDTO { VehicleId = vehicleId, VehicleCode = "TEST123" };

//             var mockSet = new Mock<DbSet<Vehicle>> ();
//             mockSet.Setup (m => m.FindAsync (vehicleId)).ReturnsAsync (vehicle);
//             mockSet.Setup (m => m.Include (It.IsAny<string> ())).Returns (mockSet.Object);
//             mockSet.Setup (m => m.FirstOrDefaultAsync (It.IsAny<System.Linq.Expressions.Expression<Func<Vehicle, bool>>> (), It.IsAny<CancellationToken> ()))
//                 .ReturnsAsync (vehicle);

//             _mockContext.Setup (c => c.Vehicles).Returns (mockSet.Object);
//             _mockMapper.Setup (m => m.Map<Vehicle, VehicleDTO> (It.Is<Vehicle> (v => v.VehicleId == vehicleId)))
//                 .Returns (vehicleDTO);

//             var query = new GetVehicleByIDQuery (vehicleId);

//             // Act
//             var result = await _handler.Handle (query, CancellationToken.None);

//             // Assert
//             Assert.NotNull (result);
//             Assert.Equal (vehicleId, result.VehicleId);
//             Assert.Equal ("TEST123", result.VehicleCode);
//             _mockMapper.Verify (m => m.Map<Vehicle, VehicleDTO> (It.Is<Vehicle> (v => v.VehicleId == vehicleId)), Times.Once);
//         }

//         [Fact]
//         public async Task Handle_InvalidId_ReturnsNull () {
//             // Arrange
//             int vehicleId = 999;
//             var mockSet = new Mock<DbSet<Vehicle>> ();
//             mockSet.Setup (m => m.Include (It.IsAny<string> ())).Returns (mockSet.Object);
//             mockSet.Setup (m => m.FirstOrDefaultAsync (It.IsAny<System.Linq.Expressions.Expression<Func<Vehicle, bool>>> (), It.IsAny<CancellationToken> ()))
//                 .ReturnsAsync ((Vehicle) null);

//             _mockContext.Setup (c => c.Vehicles).Returns (mockSet.Object);

//             var query = new GetVehicleByIDQuery (vehicleId);

//             // Act
//             var result = await _handler.Handle (query, CancellationToken.None);

//             // Assert
//             Assert.Null (result);
//             _mockMapper.Verify (m => m.Map<Vehicle, VehicleDTO> (It.IsAny<Vehicle> ()), Times.Never);
//         }
//     }
// }