# SelectBox Troubleshooting Guide

## Common Issues and Solutions

### Issue: SelectBox dropdown list not appearing

**Symptoms:**
- Clicking on SelectBox doesn't show dropdown
- No dropdown list appears when clicking the arrow
- Console shows no errors

**Root Cause:**
Using `dropDownOptions` with `container: 'body'` or complex positioning can prevent the dropdown from rendering.

**Solution:**
Remove `dropDownOptions` entirely:

```jsx
// ❌ PROBLEM: This can prevent dropdown from appearing
<SelectBox
  value={value}
  onValueChanged={handleChange}
  dataSource={data}
  displayExpr="text"
  valueExpr="value"
  dropDownOptions={{
    container: 'body',
    position: { collision: 'flip' }
  }}
/>

// ✅ SOLUTION: Simple configuration without dropDownOptions
<SelectBox
  value={value}
  onValueChanged={handleChange}
  dataSource={data}
  displayExpr="text"
  valueExpr="value"
  placeholder="Select option..."
  width="100%"
  stylingMode="outlined"
/>
```

### Issue: White text on white background in dropdown

**Symptoms:**
- Dropdown appears but text is invisible
- Can't see what options are available
- Items are selectable but not visible

**Solution:**
Add CSS to force proper text colors:

```scss
/* Fix dropdown text visibility */
.dx-popup-wrapper,
.dx-dropdownlist-popup-wrapper {
  .dx-list-item {
    color: #374151 !important;
    background-color: white !important;

    &:hover {
      background-color: #f3f4f6 !important;
      color: #111827 !important;
    }

    &.dx-state-selected {
      background-color: #3b82f6 !important;
      color: white !important;
    }

    /* Force all child elements to inherit color */
    * {
      color: inherit !important;
    }
  }
}
```

### Issue: Custom item templates not showing properly

**Solution:**
Use CSS classes on item templates and force color inheritance:

```jsx
<SelectBox
  itemTemplate={(item) => (
    <div className="custom-item tw-flex tw-items-center tw-gap-2 tw-p-2 tw-text-gray-900">
      <i className={`${item.icon} tw-text-blue-600`}></i>
      <div>
        <div className="tw-font-medium tw-text-gray-900">{item.text}</div>
        <div className="tw-text-xs tw-text-gray-500">{item.description}</div>
      </div>
    </div>
  )}
/>
```

With corresponding CSS:
```scss
.custom-item {
  color: #374151 !important;

  .tw-text-gray-900 {
    color: #111827 !important;
  }

  .tw-text-gray-500 {
    color: #6b7280 !important;
  }

  * {
    color: inherit !important;
  }
}
```

## Best Practices

1. **Keep SelectBox configuration simple**
2. **Always use `stylingMode="outlined"`**
3. **Avoid `dropDownOptions` unless absolutely necessary**
4. **Use CSS to fix styling, not JavaScript configuration**
5. **Test dropdown functionality after any changes**
6. **Use proper CSS classes for item templates**

## Testing Checklist

- [ ] Dropdown appears when clicking SelectBox
- [ ] All options are visible (not white text)
- [ ] Hover states work properly
- [ ] Selected state is clearly visible
- [ ] Custom item templates display correctly
- [ ] No console errors when opening dropdown
