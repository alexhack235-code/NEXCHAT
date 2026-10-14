"""
Logarithmic Binary Search in Rotated Sorted Arrays with O(1) Memory.
Module: rotated_binary_search_13_fb3170 | Array Size: 70
"""
from typing import List

def search_rotated(nums: List[int], target: int) -> int:
    if not nums:
        return -1
    low, high = 0, len(nums) - 1

    while low <= high:
        mid = (low + high) // 2
        if nums[mid] == target:
            return mid

        # Left half is strictly sorted
        if nums[low] <= nums[mid]:
            if nums[low] <= target < nums[mid]:
                high = mid - 1
            else:
                low = mid + 1
        # Right half is strictly sorted
        else:
            if nums[mid] < target <= nums[high]:
                low = mid + 1
            else:
                high = mid - 1

    return -1

def test_rotated_search():
    arr = [4, 5, 6, 7, 0, 1, 2]
    assert search_rotated(arr, 0) == 4
    assert search_rotated(arr, 3) == -1
