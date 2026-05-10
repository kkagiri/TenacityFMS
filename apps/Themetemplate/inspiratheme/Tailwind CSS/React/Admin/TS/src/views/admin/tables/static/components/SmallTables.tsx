const SmallTables = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Small Tables</h4>
      </div>
      <div className="card-body">
        <div className="table-wrapper">
          <table className="table">
            <thead className="font-semibold">
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 font-medium">Bluetooth Speaker</td>
                <td className="p-2">Audio</td>
                <td className="p-2">$49.00</td>
                <td className="p-2">200</td>
                <td className="p-2">4.6 ★</td>
              </tr>
              <tr>
                <td className="p-2 font-medium">Leather Wallet</td>
                <td className="p-2">Accessories</td>
                <td className="p-2">$29.99</td>
                <td className="p-2">150</td>
                <td className="p-2">4.3 ★</td>
              </tr>
              <tr>
                <td className="p-2 font-medium">Fitness Tracker</td>
                <td className="p-2">Wearables</td>
                <td className="p-2">$89.00</td>
                <td className="p-2">60</td>
                <td className="p-2">4.1 ★</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default SmallTables
