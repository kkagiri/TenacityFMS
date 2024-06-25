
const unauthorized = () => {
    return (
        <div className="content-block">
            <div style={{textAlign:'center',margin:'20px'}}>
            <h1>Unauthorized</h1>
            <p>You do not have permission to access this page.</p>
            </div>
        </div>
    )
}

export default unauthorized